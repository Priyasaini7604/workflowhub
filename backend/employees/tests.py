# employees/tests.py

from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from users.models import User
from .models import Employee
from .serializers import EmployeeStatusUpdateSerializer
from .views import (
    EmployeeCreateView,
    EmployeeArchiveView,
    EmployeeReactivateView,
    CandidateCreateView,
    EmployeeListView,
    EmployeeStatusUpdateView,
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


class CandidateCreateViewTests(TestCase):
    """Candidate intake must stay minimal — no user account, no
    employee_id, until the candidate is moved to joining_pending."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.hr_user = User.objects.create_user(
            username="hr_admin_candidate", password="test123", role="hr"
        )

    def _post(self, data):
        request = self.factory.post("/api/employees/candidates/create/", data)
        force_authenticate(request, user=self.hr_user)
        view = CandidateCreateView.as_view()
        return view(request)

    def test_candidate_created_with_no_user_and_no_employee_id(self):
        response = self._post({
            "first_name": "Riya",
            "last_name": "Sharma",
            "personal_email": "riya.sharma@example.com",
            "mobile_number": "9876543210",
            "designation": "Software Engineer",
            "department": "Tech",
        })
        self.assertEqual(response.status_code, 201, response.data)

        employee = Employee.objects.get(id=response.data["id"])
        self.assertIsNone(employee.user)
        self.assertIsNone(employee.employee_id)
        self.assertEqual(employee.current_status, "candidate")
        self.assertIsNotNone(employee.status_start_date)

    def test_candidate_creation_does_not_consume_an_employee_id(self):
        # Regression guard: candidate creation must never touch
        # generate_employee_id(), so the EMP series stays untouched.
        self._post({
            "first_name": "Aman",
            "last_name": "Verma",
            "personal_email": "aman.verma@example.com",
            "mobile_number": "9876500000",
            "designation": "Analyst",
            "department": "Finance",
        })
        self.assertFalse(
            Employee.objects.filter(employee_id__isnull=False).exists()
        )

    def test_candidate_missing_required_name_fields_rejected(self):
        response = self._post({
            "personal_email": "noname@example.com",
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn("first_name", response.data)


class EmployeeListViewCandidateSafetyTests(TestCase):
    """A candidate has no linked User yet — the list endpoint must not
    crash trying to read user.role for them."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.hr_user = User.objects.create_user(
            username="hr_admin_list", password="test123", role="hr"
        )
        Employee.objects.create(
            first_name="Candidate",
            last_name="Test",
            personal_email="candidate.test@example.com",
            current_status="candidate",
        )

    def test_list_does_not_crash_with_userless_candidate(self):
        request = self.factory.get("/api/employees/")
        force_authenticate(request, user=self.hr_user)
        view = EmployeeListView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 200)

class EmployeeStatusUpdateProvisioningTests(TestCase):
    """The joining_pending transition is where a candidate becomes a
    real employee — this is the only place a User account and
    employee_id should ever get created."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.hr_user = User.objects.create_user(
            username="hr_admin_provision", password="test123", role="hr"
        )

    def _patch(self, employee, new_status):
        request = self.factory.patch(
            f"/api/employees/{employee.id}/status/",
            {"new_status": new_status},
            format="json",
        )
        force_authenticate(request, user=self.hr_user)
        request.data = {"new_status": new_status}
        view = EmployeeStatusUpdateView.as_view()
        return view(request, pk=employee.id)

    def test_joining_pending_provisions_user_account(self):
        candidate = Employee.objects.create(
            first_name="Neha",
            last_name="Gupta",
            personal_email="neha.gupta@example.com",
            current_status="offer_sent",
        )

        response = self._patch(candidate, "joining_pending")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn("temp_password", response.data)
        self.assertIn("username", response.data)
        self.assertIn("employee_id", response.data)

        candidate.refresh_from_db()
        self.assertIsNotNone(candidate.user)
        self.assertIsNotNone(candidate.employee_id)
        self.assertEqual(candidate.user.username, candidate.employee_id.lower())
        self.assertEqual(candidate.user.role, "employee")
        self.assertEqual(candidate.current_status, "joining_pending")

    def test_password_is_usable_for_login(self):
        candidate = Employee.objects.create(
            first_name="Karan",
            last_name="Mehta",
            personal_email="karan.mehta@example.com",
            current_status="offer_sent",
        )

        response = self._patch(candidate, "joining_pending")
        candidate.refresh_from_db()

        self.assertTrue(
            candidate.user.check_password(response.data["temp_password"])
        )

    def test_reactivating_status_change_does_not_touch_existing_user(self):
        # An employee who already has a user (normal, non-candidate flow)
        # must not get re-provisioned or have their account touched.
        employee = make_employee(current_status="joining_pending")
        original_user_id = employee.user.id
        original_employee_id = employee.employee_id

        response = self._patch(employee, "onboarding")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertNotIn("temp_password", response.data)

        employee.refresh_from_db()
        self.assertEqual(employee.user.id, original_user_id)
        self.assertEqual(employee.employee_id, original_employee_id)
