# access/tests.py

from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from users.models import User
from employees.models import Employee
from .models import SoftwareAccess
from .serializers import (
    SoftwareAccessCreateSerializer,
    SoftwareAccessRevokeSerializer,
)
from .views import (
    SoftwareAccessListCreateView,
    SoftwareAccessRevokeView,
    EmployeePendingAccessView,
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


class SoftwareAccessCreateSerializerTests(TestCase):
    """Grant flow — status should always end up 'active', regardless
    of what (if anything) was sent for it, and granted_by must be
    the requesting user."""

    def setUp(self):
        self.employee = make_employee()
        self.hr_user = User.objects.create_user(
            username="hr1", password="test123", role="hr"
        )

    def test_create_forces_status_active(self):
        factory = APIRequestFactory()
        request = factory.post("/api/access/", {})
        force_authenticate(request, user=self.hr_user)
        request.user = self.hr_user  # DRF wraps this in real views

        serializer = SoftwareAccessCreateSerializer(
            data={
                "employee": self.employee.id,
                "software_name": "Slack",
                "access_level": "Admin",
            },
            context={"request": request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()

        self.assertEqual(instance.status, "active")
        self.assertEqual(instance.granted_by, self.hr_user)

    def test_create_ignores_client_supplied_status(self):
        # Even if a status field were somehow present, the serializer's
        # Meta.fields doesn't include it — so it can't be set via input.
        factory = APIRequestFactory()
        request = factory.post("/api/access/", {})
        force_authenticate(request, user=self.hr_user)
        request.user = self.hr_user

        serializer = SoftwareAccessCreateSerializer(
            data={
                "employee": self.employee.id,
                "software_name": "GitHub",
                "access_level": "",
                "status": "pending",  # not a valid input field
            },
            context={"request": request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()
        self.assertEqual(instance.status, "active")


class SoftwareAccessRevokeSerializerTests(TestCase):
    """Revoke endpoint should only ever accept status='revoked'."""

    def setUp(self):
        self.employee = make_employee()
        self.access = SoftwareAccess.objects.create(
            employee=self.employee, software_name="Slack", status="active",
        )

    def test_revoked_status_accepted(self):
        serializer = SoftwareAccessRevokeSerializer(
            instance=self.access, data={"status": "revoked"}, partial=True
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_active_status_rejected(self):
        serializer = SoftwareAccessRevokeSerializer(
            instance=self.access, data={"status": "active"}, partial=True
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("status", serializer.errors)

    def test_pending_status_rejected(self):
        serializer = SoftwareAccessRevokeSerializer(
            instance=self.access, data={"status": "pending"}, partial=True
        )
        self.assertFalse(serializer.is_valid())


class SoftwareAccessRevokeViewTests(TestCase):
    """Revoking through the view must stamp revoked_on/revoked_by,
    not just flip status."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.employee = make_employee()
        self.hr_user = User.objects.create_user(
            username="hr2", password="test123", role="hr"
        )
        self.access = SoftwareAccess.objects.create(
            employee=self.employee, software_name="Slack", status="active",
        )

    def test_revoke_sets_all_expected_fields(self):
        request = self.factory.patch(
            f"/api/access/{self.access.id}/revoke/", {"status": "revoked"}
        )
        force_authenticate(request, user=self.hr_user)
        view = SoftwareAccessRevokeView.as_view()
        response = view(request, pk=self.access.id)

        self.assertEqual(response.status_code, 200)
        self.access.refresh_from_db()
        self.assertEqual(self.access.status, "revoked")
        self.assertIsNotNone(self.access.revoked_on)
        self.assertEqual(self.access.revoked_by, self.hr_user)


class EmployeePendingAccessViewTests(TestCase):
    """This is the query offboarding relies on to know whether an
    employee still has active access — must exclude revoked and
    archived records.

    NOTE: this view has global DRF pagination applied (no
    pagination_class override), so response.data is a paginated
    envelope: {"count", "next", "previous", "results"} — not a bare
    list. Always index into ["results"]."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.employee = make_employee()
        self.hr_user = User.objects.create_user(
            username="hr3", password="test123", role="hr"
        )

    def _get(self):
        request = self.factory.get(
            f"/api/access/employee/{self.employee.id}/pending/"
        )
        force_authenticate(request, user=self.hr_user)
        view = EmployeePendingAccessView.as_view()
        response = view(request, employee_id=self.employee.id)
        return response

    def test_returns_only_active_non_archived_access(self):
        SoftwareAccess.objects.create(
            employee=self.employee, software_name="Slack", status="active",
        )
        SoftwareAccess.objects.create(
            employee=self.employee, software_name="GitHub", status="revoked",
        )
        SoftwareAccess.objects.create(
            employee=self.employee, software_name="Jira",
            status="active", is_archived=True,
        )

        response = self._get()
        results = response.data["results"]
        names = [item["software_name"] for item in results]

        self.assertEqual(names, ["Slack"])

    def test_empty_when_no_active_access(self):
        SoftwareAccess.objects.create(
            employee=self.employee, software_name="Slack", status="revoked",
        )
        response = self._get()
        self.assertEqual(len(response.data["results"]), 0)


class SoftwareAccessListCreateViewFilterTests(TestCase):
    """The main list endpoint's employee/status query-param filters
    and default archived exclusion.

    NOTE: same pagination envelope applies here — index into
    response.data["results"]."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.hr_user = User.objects.create_user(
            username="hr4", password="test123", role="hr"
        )
        self.employee1 = make_employee()
        self.employee2 = make_employee()

        SoftwareAccess.objects.create(
            employee=self.employee1, software_name="Slack", status="active",
        )
        SoftwareAccess.objects.create(
            employee=self.employee1, software_name="GitHub", status="revoked",
        )
        SoftwareAccess.objects.create(
            employee=self.employee2, software_name="Jira", status="active",
        )
        SoftwareAccess.objects.create(
            employee=self.employee1, software_name="Notion",
            status="active", is_archived=True,
        )

    def _get(self, params=""):
        request = self.factory.get(f"/api/access/{params}")
        force_authenticate(request, user=self.hr_user)
        view = SoftwareAccessListCreateView.as_view()
        return view(request)

    def test_archived_excluded_by_default(self):
        response = self._get()
        names = [item["software_name"] for item in response.data["results"]]
        self.assertNotIn("Notion", names)

    def test_filter_by_employee(self):
        response = self._get(f"?employee={self.employee1.id}")
        names = {item["software_name"] for item in response.data["results"]}
        self.assertEqual(names, {"Slack", "GitHub"})

    def test_filter_by_status(self):
        response = self._get("?status=active")
        names = {item["software_name"] for item in response.data["results"]}
        self.assertEqual(names, {"Slack", "Jira"})
