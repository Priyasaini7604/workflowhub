# assets/tests.py

from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from users.models import User
from employees.models import Employee
from master_data.models import AssetCategory
from offboarding.models import OffboardingChecklist
from .models import Asset, AssetAllocationHistory
from .serializers import AssetCreateSerializer
from .views import (
    AssetCreateView,
    AssetAcknowledgeView,
    AssetConfirmReturnView,
)

_counter = 0


def make_employee(**overrides):
    global _counter
    _counter += 1

    user = overrides.pop('user', None)
    if user is None:
        user = User.objects.create_user(
            username=f"testuser{_counter}",
            password="testpass123",
            role=overrides.pop('role', 'employee'),
        )

    defaults = {
        'user': user,
        'employee_id': f"EMP{900 + _counter}",
        'first_name': "Test",
        'last_name': f"User{_counter}",
        'designation': "Engineer",
        'department': "Tech",
        'date_of_joining': "2025-01-01",
        'current_status': "active",
    }
    defaults.update(overrides)
    return Employee.objects.create(**defaults)


def make_category(**overrides):
    global _counter
    _counter += 1
    defaults = {
        'name': f"Category{_counter}",
        'code': f"CAT{_counter}",
        'asset_id_prefix': f"C{_counter}",
    }
    defaults.update(overrides)
    return AssetCategory.objects.create(**defaults)


def make_asset(**overrides):
    global _counter
    _counter += 1
    category = overrides.pop('category', None) or make_category()
    defaults = {
        'asset_id': f"AST{900 + _counter}",
        'category': category,
        'serial_number': f"SN{900 + _counter}",
        'status': 'available',
    }
    defaults.update(overrides)
    return Asset.objects.create(**defaults)


class AssetCreateSerializerValidationTests(TestCase):
    """Business rules for editing an asset — these guard against
    silently corrupting the assignment state machine."""

    def setUp(self):
        self.employee1 = make_employee()
        self.employee2 = make_employee()
        self.category = make_category()

    def test_new_asset_skips_assignment_checks(self):
        # self.instance is None — no assignment rules should apply
        serializer = AssetCreateSerializer(data={
            "category": self.category.id,
            "status": "available",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_pending_return_asset_cannot_be_edited(self):
        asset = make_asset(
            category=self.category,
            status="pending_return",
            assigned_to=self.employee1,
        )
        serializer = AssetCreateSerializer(
            instance=asset,
            data={"brand": "NewBrand"},
            partial=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("detail", serializer.errors)

    def test_cannot_assign_retired_asset(self):
        asset = make_asset(category=self.category, status="available")
        serializer = AssetCreateSerializer(
            instance=asset,
            data={"assigned_to": self.employee1.id, "status": "retired"},
            partial=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("assigned_to", serializer.errors)

    def test_cannot_assign_under_repair_asset(self):
        asset = make_asset(category=self.category, status="available")
        serializer = AssetCreateSerializer(
            instance=asset,
            data={"assigned_to": self.employee1.id, "status": "under_repair"},
            partial=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("assigned_to", serializer.errors)

    def test_cannot_reassign_already_assigned_asset_directly(self):
        asset = make_asset(
            category=self.category,
            status="assigned",
            assigned_to=self.employee1,
        )
        serializer = AssetCreateSerializer(
            instance=asset,
            data={"assigned_to": self.employee2.id},
            partial=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("assigned_to", serializer.errors)

    def test_reassigning_to_same_employee_is_allowed(self):
        asset = make_asset(
            category=self.category,
            status="assigned",
            assigned_to=self.employee1,
        )
        serializer = AssetCreateSerializer(
            instance=asset,
            data={"assigned_to": self.employee1.id, "brand": "Dell"},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_cannot_retire_assigned_asset_without_unassigning(self):
        asset = make_asset(
            category=self.category,
            status="assigned",
            assigned_to=self.employee1,
        )
        serializer = AssetCreateSerializer(
            instance=asset,
            data={"status": "retired", "assigned_to": self.employee1.id},
            partial=True,
        )
        self.assertFalse(serializer.is_valid())
        # NOTE: Check 2 (new_assigned_to is not None + retired/under_repair)
        # fires before Check 4 (assigned status -> retired) ever can — Check 4
        # is currently unreachable dead code given this validation order.
        # Locking in ACTUAL behavior here; flagged separately for cleanup.
        self.assertIn("assigned_to", serializer.errors)

    def test_can_retire_asset_after_unassigning(self):
        asset = make_asset(
            category=self.category,
            status="assigned",
            assigned_to=self.employee1,
        )
        serializer = AssetCreateSerializer(
            instance=asset,
            data={"status": "retired", "assigned_to": None},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)


class GenerateAssetIdTests(TestCase):
    """Same gap-filling ID-generation pattern as Employee IDs."""

    def setUp(self):
        self.view = AssetCreateView()
        self.category = make_category()

    def test_first_id_is_ast001(self):
        expected_prefix = f"MPRW{self.category.asset_id_prefix}"
        self.assertEqual(
            self.view.generate_asset_id(self.category), f"{expected_prefix}001"
        )

    def test_fills_gap_if_middle_id_is_free(self):
        prefix = f"MPRW{self.category.asset_id_prefix}"
        make_asset(asset_id=f"{prefix}001", category=self.category)
        make_asset(asset_id=f"{prefix}003", category=self.category)
        self.assertEqual(
            self.view.generate_asset_id(self.category), f"{prefix}002"
        )


class AssetAcknowledgeViewTests(TestCase):
    """Security-critical: only the assigned employee can accept/reject,
    and status transitions must be exact."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.employee = make_employee()
        self.other_employee = make_employee()
        self.category = make_category()

        self.asset = make_asset(
            category=self.category,
            status="pending_acknowledgment",
            assigned_to=self.employee,
        )
        AssetAllocationHistory.objects.create(
            asset=self.asset,
            employee=self.employee,
            assigned_date="2026-01-01",
            acknowledgment_status="pending",
        )

    def _post(self, user, action):
        request = self.factory.post(
            f"/api/assets/{self.asset.id}/acknowledge/", {"action": action}
        )
        force_authenticate(request, user=user)
        request.data = {"action": action}
        view = AssetAcknowledgeView.as_view()
        return view(request, pk=self.asset.id)

    def test_wrong_employee_cannot_acknowledge(self):
        response = self._post(self.other_employee.user, "accept")
        self.assertEqual(response.status_code, 403)

    def test_accept_marks_asset_assigned(self):
        response = self._post(self.employee.user, "accept")
        self.assertEqual(response.status_code, 200)

        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, "assigned")
        self.assertIsNotNone(self.asset.acknowledged_at)

        history = AssetAllocationHistory.objects.get(asset=self.asset)
        self.assertEqual(history.acknowledgment_status, "acknowledged")

    def test_reject_reverts_asset_to_available_and_unassigns(self):
        response = self._post(self.employee.user, "reject")
        self.assertEqual(response.status_code, 200)

        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, "available")
        self.assertIsNone(self.asset.assigned_to)

        history = AssetAllocationHistory.objects.get(asset=self.asset)
        self.assertEqual(history.acknowledgment_status, "rejected")

    def test_invalid_action_rejected(self):
        response = self._post(self.employee.user, "maybe")
        self.assertEqual(response.status_code, 400)

    def test_cannot_acknowledge_when_not_pending(self):
        self.asset.status = "assigned"
        self.asset.save()
        response = self._post(self.employee.user, "accept")
        self.assertEqual(response.status_code, 400)


class AssetConfirmReturnAndRecoverySyncTests(TestCase):
    """This is the cross-app sync with offboarding — must correctly
    detect 'employee holds zero assets' and flip asset_recovery_status."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.employee = make_employee(current_status="offboarding")
        self.category = make_category()

        self.asset = make_asset(
            category=self.category,
            status="pending_return",
            assigned_to=self.employee,
        )
        AssetAllocationHistory.objects.create(
            asset=self.asset,
            employee=self.employee,
            assigned_date="2026-01-01",
        )

    @patch("assets.views.notify")
    def _confirm_return(self, mock_notify):
        request = self.factory.post(
            f"/api/assets/{self.asset.id}/confirm-return/", {}
        )
        force_authenticate(request, user=self.employee.user)
        view = AssetConfirmReturnView.as_view()
        return view(request, pk=self.asset.id)

    def test_return_frees_the_asset(self):
        response = self._confirm_return()
        self.assertEqual(response.status_code, 200)

        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, "available")
        self.assertIsNone(self.asset.assigned_to)

    def test_return_closes_open_allocation_history(self):
        self._confirm_return()
        history = AssetAllocationHistory.objects.get(asset=self.asset)
        self.assertIsNotNone(history.returned_date)

    def test_marks_asset_recovery_complete_when_last_asset_returned(self):
        checklist = OffboardingChecklist.objects.create(
            employee=self.employee, asset_recovery_status=False,
        )

        self._confirm_return()

        checklist.refresh_from_db()
        self.assertTrue(checklist.asset_recovery_status)

    def test_does_not_mark_recovery_complete_if_other_assets_remain(self):
        # Employee still holds a second asset after this one is returned
        make_asset(
            category=self.category,
            status="assigned",
            assigned_to=self.employee,
        )
        checklist = OffboardingChecklist.objects.create(
            employee=self.employee, asset_recovery_status=False,
        )

        self._confirm_return()

        checklist.refresh_from_db()
        self.assertFalse(checklist.asset_recovery_status)

    def test_wrong_employee_cannot_confirm_return(self):
        other_employee = make_employee()
        request = self.factory.post(
            f"/api/assets/{self.asset.id}/confirm-return/", {}
        )
        force_authenticate(request, user=other_employee.user)
        view = AssetConfirmReturnView.as_view()
        response = view(request, pk=self.asset.id)
        self.assertEqual(response.status_code, 403)
