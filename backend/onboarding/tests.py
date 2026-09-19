# onboarding/tests.py

from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from users.models import User
from employees.models import Employee
from .models import OnboardingTask, OnboardingChecklist
from .views import OnboardingTaskUpdateView, OnboardingChecklistView

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
        'current_status': "joining_pending",
    }
    defaults.update(overrides)
    return Employee.objects.create(**defaults)


class OnboardingChecklistModelTests(TestCase):
    """Completion percentage is an average of 5 boolean-ish fields."""

    def setUp(self):
        self.employee = make_employee()

    def test_zero_percent_when_nothing_done(self):
        checklist = OnboardingChecklist.objects.create(employee=self.employee)
        self.assertEqual(checklist.onboarding_completion_percentage, 0)

    def test_partial_completion(self):
        checklist = OnboardingChecklist.objects.create(
            employee=self.employee,
            offer_letter_uploaded=True,
            documents_submitted=True,
            # 2 of 5 fields true = 40%
        )
        self.assertEqual(checklist.onboarding_completion_percentage, 40)

    def test_background_verification_only_counts_when_completed(self):
        checklist = OnboardingChecklist.objects.create(
            employee=self.employee,
            background_verification_status="in_progress",
            # in_progress should NOT count toward completion
        )
        self.assertEqual(checklist.onboarding_completion_percentage, 0)

        checklist.background_verification_status = "completed"
        checklist.save()
        self.assertEqual(checklist.onboarding_completion_percentage, 20)

    def test_full_completion_is_100_percent(self):
        checklist = OnboardingChecklist.objects.create(
            employee=self.employee,
            offer_letter_uploaded=True,
            documents_submitted=True,
            documents_verified=True,
            induction_completed=True,
            background_verification_status="completed",
        )
        self.assertEqual(checklist.onboarding_completion_percentage, 100)


class OnboardingTaskSyncTests(TestCase):
    """Locks in the two different sync behaviors in
    OnboardingTaskUpdateView.perform_update — induction only syncs on
    completion, background verification mirrors every status change."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.employee = make_employee()
        self.hr_user = User.objects.create_user(
            username="hr_ob", password="test123", role="hr"
        )

    def _update_task(self, task, new_status):
        request = self.factory.patch(
            f"/api/onboarding/tasks/{task.id}/", {"status": new_status}
        )
        force_authenticate(request, user=self.hr_user)
        view = OnboardingTaskUpdateView.as_view()
        return view(request, pk=task.id)

    def test_induction_task_only_syncs_when_completed(self):
        task = OnboardingTask.objects.create(
            employee=self.employee,
            task_name="Conduct induction session",
            assigned_to_role="hr",
            status="pending",
        )

        # Move to in_progress — should NOT flip induction_completed
        self._update_task(task, "in_progress")
        checklist = OnboardingChecklist.objects.get(employee=self.employee)
        self.assertFalse(checklist.induction_completed)

        # Move to completed — NOW it should flip
        task.refresh_from_db()
        self._update_task(task, "completed")
        checklist.refresh_from_db()
        self.assertTrue(checklist.induction_completed)

    def test_background_verification_mirrors_every_status_change(self):
        task = OnboardingTask.objects.create(
            employee=self.employee,
            task_name="Conduct background verification",
            assigned_to_role="hr",
            status="pending",
        )

        # Even a non-completed status should mirror immediately —
        # unlike induction, this doesn't wait for 'completed'
        self._update_task(task, "in_progress")
        checklist = OnboardingChecklist.objects.get(employee=self.employee)
        self.assertEqual(
            checklist.background_verification_status,
            "in_progress")

        task.refresh_from_db()
        self._update_task(task, "completed")
        checklist.refresh_from_db()
        self.assertEqual(checklist.background_verification_status, "completed")

    def test_unrelated_task_does_not_touch_checklist_fields(self):
        task = OnboardingTask.objects.create(
            employee=self.employee,
            task_name="Complete policy acceptance form",
            assigned_to_role="employee",
            status="pending",
        )

        self._update_task(task, "completed")
        checklist = OnboardingChecklist.objects.get(employee=self.employee)

        self.assertFalse(checklist.induction_completed)
        self.assertEqual(checklist.background_verification_status, "pending")

    def test_background_verification_failed_status_not_settable_via_task_sync(
            self):
        """
        The 'failed' status is documented as a manual-override-only value —
        it's not one of OnboardingTask.STATUS_CHOICES, so the task-sync
        path can never produce it. Only a direct checklist update can.
        """
        task = OnboardingTask.objects.create(
            employee=self.employee,
            task_name="Conduct background verification",
            assigned_to_role="hr",
            status="completed",
        )
        self._update_task(task, "completed")

        checklist = OnboardingChecklist.objects.get(employee=self.employee)
        self.assertNotEqual(checklist.background_verification_status, "failed")

        # But a direct update to the checklist CAN set 'failed'
        checklist.background_verification_status = "failed"
        checklist.save()
        self.assertEqual(checklist.background_verification_status, "failed")


class OnboardingChecklistViewGetOrCreateTests(TestCase):
    """First access creates the checklist AND the 6 default tasks;
    subsequent access must not duplicate them."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.employee = make_employee()
        self.hr_user = User.objects.create_user(
            username="hr_ob2", password="test123", role="hr"
        )

    def _get_checklist(self):
        request = self.factory.get(
            f"/api/onboarding/checklist/{self.employee.id}/"
        )
        force_authenticate(request, user=self.hr_user)
        view = OnboardingChecklistView.as_view()
        return view(request, employee_id=self.employee.id)

    def test_first_call_creates_checklist_and_default_tasks(self):
        self.assertEqual(
            OnboardingTask.objects.filter(employee=self.employee).count(), 0
        )

        response = self._get_checklist()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            OnboardingChecklist.objects.filter(
                employee=self.employee).count(), 1)
        self.assertEqual(
            OnboardingTask.objects.filter(employee=self.employee).count(), 6
        )

    def test_second_call_does_not_duplicate_tasks(self):
        self._get_checklist()  # first call — creates everything
        self._get_checklist()  # second call — should be a no-op for creation

        self.assertEqual(
            OnboardingChecklist.objects.filter(
                employee=self.employee).count(), 1)
        self.assertEqual(
            OnboardingTask.objects.filter(employee=self.employee).count(), 6
        )
