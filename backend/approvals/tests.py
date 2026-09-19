# approvals/tests.py

from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from users.models import User
from employees.models import Employee
from documents.models import Document
from onboarding.models import OnboardingTask
from offboarding.models import OffboardingTask
from assets.models import Asset
from master_data.models import AssetCategory
from .views import ApprovalsCenterView

_counter = 0


def make_employee(**overrides):
    global _counter
    _counter += 1

    user = overrides.pop('user', None)
    if user is None:
        user = User.objects.create_user(
            username=f"apprvuser{_counter}",
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


class ApprovalsCenterRoleVisibilityTests(TestCase):
    """The core value of this view is per-role filtering — each role
    should see exactly the item types relevant to them, nothing else."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.hr_user = User.objects.create_user(
            username="hr_appr", password="test123", role="hr"
        )
        self.it_user = User.objects.create_user(
            username="it_appr", password="test123", role="it"
        )
        self.manager_user = User.objects.create_user(
            username="mgr_appr", password="test123", role="manager"
        )
        self.superadmin_user = User.objects.create_user(
            username="sa_appr", password="test123", role="superadmin"
        )
        self.employee = make_employee(current_status="offboarding")

        Document.objects.create(
            employee=self.employee, document_type="resume",
            verification_status="pending",
        )
        OnboardingTask.objects.create(
            employee=self.employee, task_name="HR task",
            assigned_to_role="hr", status="pending",
        )
        OnboardingTask.objects.create(
            employee=self.employee, task_name="IT task",
            assigned_to_role="it", status="pending",
        )
        OnboardingTask.objects.create(
            employee=self.employee, task_name="Manager task",
            assigned_to_role="manager", status="pending",
        )
        OffboardingTask.objects.create(
            employee=self.employee, task_name="Offboarding HR task",
            assigned_to_role="hr", status="pending",
        )
        category = AssetCategory.objects.create(name="Laptop", code="laptop")
        Asset.objects.create(
            asset_id="AST001", category=category,
            assigned_to=self.employee, status="pending_acknowledgment",
        )

    def _get(self, user):
        request = self.factory.get("/api/approvals/")
        force_authenticate(request, user=user)
        view = ApprovalsCenterView.as_view()
        return view(request)

    def test_hr_sees_documents_and_only_own_role_tasks(self):
        response = self._get(self.hr_user)
        types = [item['type'] for item in response.data['items']]

        self.assertIn('document', types)
        self.assertEqual(types.count('onboarding_task'), 1)
        self.assertEqual(types.count('offboarding_task'), 1)
        self.assertNotIn('asset_acknowledgment', types)

        titles = [item['title'] for item in response.data['items']]
        self.assertNotIn('IT task', titles)
        self.assertNotIn('Manager task', titles)

    def test_it_sees_assets_but_not_documents(self):
        response = self._get(self.it_user)
        types = [item['type'] for item in response.data['items']]

        self.assertIn('asset_acknowledgment', types)
        self.assertNotIn('document', types)

        titles = [item['title'] for item in response.data['items']]
        self.assertIn('IT task', titles)
        self.assertNotIn('HR task', titles)

    def test_manager_sees_only_manager_role_tasks_no_documents_no_assets(self):
        response = self._get(self.manager_user)
        types = [item['type'] for item in response.data['items']]

        self.assertNotIn('document', types)
        self.assertNotIn('asset_acknowledgment', types)

        titles = [item['title'] for item in response.data['items']]
        self.assertIn('Manager task', titles)
        self.assertNotIn('HR task', titles)
        self.assertNotIn('IT task', titles)

    def test_superadmin_sees_everything_unfiltered(self):
        response = self._get(self.superadmin_user)
        types = [item['type'] for item in response.data['items']]

        self.assertIn('document', types)
        self.assertIn('asset_acknowledgment', types)
        # superadmin gets ALL onboarding tasks regardless of assigned_to_role
        self.assertEqual(types.count('onboarding_task'), 3)

    def test_total_pending_matches_items_length(self):
        response = self._get(self.superadmin_user)
        self.assertEqual(
            response.data['total_pending'], len(response.data['items'])
        )


class ApprovalsCenterOffboardingEligibilityTests(TestCase):
    """Safety-net filter: offboarding tasks only surface for employees
    whose current_status is actually offboarding-eligible — guards
    against stale tasks left from the earlier 'active employee got
    offboarding tasks' bug."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.hr_user = User.objects.create_user(
            username="hr_appr2", password="test123", role="hr"
        )

    def _get(self):
        request = self.factory.get("/api/approvals/")
        force_authenticate(request, user=self.hr_user)
        view = ApprovalsCenterView.as_view()
        return view(request)

    def test_offboarding_task_hidden_for_active_employee(self):
        # Simulates the stale-data scenario: a task exists but the
        # employee's status was later reset to 'active'
        stale_employee = make_employee(current_status="active")
        OffboardingTask.objects.create(
            employee=stale_employee, task_name="Stale task",
            assigned_to_role="hr", status="pending",
        )

        response = self._get()
        titles = [item['title'] for item in response.data['items']]
        self.assertNotIn('Stale task', titles)

    def test_offboarding_task_shown_for_eligible_statuses(self):
        for status_value in ['notice_period', 'offboarding', 'exited']:
            emp = make_employee(current_status=status_value)
            OffboardingTask.objects.create(
                employee=emp, task_name=f"Task for {status_value}",
                assigned_to_role="hr", status="pending",
            )

        response = self._get()
        titles = [item['title'] for item in response.data['items']]
        for status_value in ['notice_period', 'offboarding', 'exited']:
            self.assertIn(f"Task for {status_value}", titles)


class ApprovalsCenterSortingTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.superadmin_user = User.objects.create_user(
            username="sa_appr2", password="test123", role="superadmin"
        )
        self.employee = make_employee()

    def test_items_sorted_by_created_at_ascending(self):
        # Documents are created_at-stamped in creation order — create a
        # few in reverse-priority order and confirm the response respects
        # actual timestamps, not insertion type-order
        Document.objects.create(
            employee=self.employee, document_type="resume",
            verification_status="pending",
        )
        OnboardingTask.objects.create(
            employee=self.employee, task_name="Later task",
            assigned_to_role="hr", status="pending",
        )

        request = self.factory.get("/api/approvals/")
        force_authenticate(request, user=self.superadmin_user)
        view = ApprovalsCenterView.as_view()
        response = view(request)

        created_ats = [item['created_at'] for item in response.data['items']]
        self.assertEqual(created_ats, sorted(created_ats))
