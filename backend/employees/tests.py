# employees/tests.py

from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from users.models import User
from .models import Employee
from .serializers import EmployeeStatusUpdateSerializer
from .views import EmployeeCreateView, EmployeeArchiveView, EmployeeReactivateView

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


class EmployeeStatusTransitionTests(TestCase):
    """Locks in the allowed lifecycle transitions — the state machine
    that keeps offboarding data trustworthy."""

    def setUp(self):
        self.employee = make_employee(current_status="active")

    def _validate(self, new_status):
        serializer = EmployeeStatusUpdateSerializer(
            data={"new_status": new_status},
            context={"employee": self.employee},
        )
        return serializer.is_valid(), serializer.errors

    def test_valid_forward_transition_allowed(self):
        is_valid, errors = self._validate("notice_period")
        self.assertTrue(is_valid, errors)

    def test_skipping_a_stage_is_rejected(self):
        # active -> exited directly should NOT be allowed
        is_valid, errors = self._validate("exited")
        self.assertFalse(is_valid)
        self.assertIn("new_status", errors)

    def test_backward_transition_is_rejected(self):
        self.employee.current_status = "notice_period"
        self.employee.save()
        is_valid, errors = self._validate("active")
        self.assertFalse(is_valid)

    def test_exited_has_no_further_transitions(self):
        self.employee.current_status = "exited"
        self.employee.save()
        is_valid, errors = self._validate("active")
        self.assertFalse(is_valid)

    def test_full_lifecycle_path_is_all_valid(self):
        # joining_pending -> onboarding -> active -> notice_period ->
        # offboarding -> exited
        path = [
            "onboarding",
            "active",
            "notice_period",
            "offboarding",
            "exited"]
        self.employee.current_status = "joining_pending"
        self.employee.save()

        for next_status in path:
            is_valid, errors = self._validate(next_status)
            self.assertTrue(is_valid, f"{next_status} failed: {errors}")
            self.employee.current_status = next_status
            self.employee.save()

    def test_joining_pending_cannot_skip_onboarding(self):
        # joining_pending -> active directly should NOT be allowed anymore
        self.employee.current_status = "joining_pending"
        self.employee.save()
        is_valid, errors = self._validate("active")
        self.assertFalse(is_valid)
        self.assertIn("new_status", errors)


class GenerateEmployeeIdTests(TestCase):
    """Tests the sequential EMP001, EMP002... ID generator, including
    the gap-filling behavior when an earlier ID was archived/deleted."""

    def setUp(self):
        self.view = EmployeeCreateView()

    def test_first_id_is_emp001(self):
        self.assertEqual(self.view.generate_employee_id(), "EMP001")

    def test_next_id_increments(self):
        make_employee(employee_id="EMP001")
        self.assertEqual(self.view.generate_employee_id(), "EMP002")

    def test_fills_gap_if_middle_id_is_free(self):
        # EMP001 and EMP003 exist, EMP002 doesn't — should reuse EMP002
        make_employee(employee_id="EMP001")
        make_employee(employee_id="EMP003")
        self.assertEqual(self.view.generate_employee_id(), "EMP002")

    def test_skips_all_taken_ids(self):
        make_employee(employee_id="EMP001")
        make_employee(employee_id="EMP002")
        make_employee(employee_id="EMP003")
        self.assertEqual(self.view.generate_employee_id(), "EMP004")


class EmployeeArchiveViewTests(TestCase):
    """The archive/reactivate flip on the linked User account is the
    security-relevant part — an archived employee must not be able
    to log in."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.hr_user = User.objects.create_user(
            username="hr_admin", password="test123", role="hr"
        )
        self.employee = make_employee(current_status="active")
        self.employee.user.is_active = True
        self.employee.user.save()

    def test_archive_deactivates_linked_user(self):
        request = self.factory.patch(
            f"/api/employees/{self.employee.id}/archive/", {}
        )
        force_authenticate(request, user=self.hr_user)
        view = EmployeeArchiveView.as_view()
        response = view(request, pk=self.employee.id)

        self.assertEqual(response.status_code, 200)
        self.employee.user.refresh_from_db()
        self.assertFalse(self.employee.user.is_active)

        self.employee.refresh_from_db()
        self.assertTrue(self.employee.is_archived)
        self.assertIsNotNone(self.employee.archived_at)

    def test_reactivate_reactivates_linked_user_and_resets_status(self):
        # First archive it
        self.employee.is_archived = True
        self.employee.save()
        self.employee.user.is_active = False
        self.employee.user.save()

        request = self.factory.patch(
            f"/api/employees/{self.employee.id}/reactivate/", {}
        )
        force_authenticate(request, user=self.hr_user)
        view = EmployeeReactivateView.as_view()
        response = view(request, pk=self.employee.id)

        self.assertEqual(response.status_code, 200)
        self.employee.user.refresh_from_db()
        self.assertTrue(self.employee.user.is_active)

        self.employee.refresh_from_db()
        self.assertFalse(self.employee.is_archived)
        self.assertEqual(self.employee.current_status, "active")

    def test_reactivate_view_only_finds_archived_employees(self):
        # employee is NOT archived — should 404, since get_queryset()
        # filters to is_archived=True only
        request = self.factory.patch(
            f"/api/employees/{self.employee.id}/reactivate/", {}
        )
        force_authenticate(request, user=self.hr_user)
        view = EmployeeReactivateView.as_view()
        response = view(request, pk=self.employee.id)

        self.assertEqual(response.status_code, 404)
