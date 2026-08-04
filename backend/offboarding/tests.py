# offboarding/tests.py

from unittest.mock import patch
from django.test import TestCase
from users.models import User
from employees.models import Employee
from access.models import SoftwareAccess
from .models import OffboardingChecklist, OffboardingTask
from .serializers import OffboardingChecklistUpdateSerializer
from .services import (
    is_access_revoked,
    sync_employee_lifecycle_from_checklist,
    is_managers_team_member,
    sync_checklist_from_task_completion,
)

_counter = 0


def make_employee(**overrides):
    """Factory helper — creates a User + Employee with all required
    fields filled, with sane unique defaults. Pass overrides for
    anything a specific test needs to control."""
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
        'current_status': "offboarding",
    }
    defaults.update(overrides)
    return Employee.objects.create(**defaults)


class IsAccessRevokedTests(TestCase):
    def setUp(self):
        self.employee = make_employee()

    def test_true_when_no_access_records_exist(self):
        self.assertTrue(is_access_revoked(self.employee))

    def test_false_when_active_access_exists(self):
        SoftwareAccess.objects.create(
            employee=self.employee, software_name="Slack", status="active",
        )
        self.assertFalse(is_access_revoked(self.employee))

    def test_true_when_only_revoked_access_exists(self):
        SoftwareAccess.objects.create(
            employee=self.employee, software_name="Slack", status="revoked",
        )
        self.assertTrue(is_access_revoked(self.employee))

    def test_true_when_active_access_is_archived(self):
        SoftwareAccess.objects.create(
            employee=self.employee, software_name="Slack",
            status="active", is_archived=True,
        )
        self.assertTrue(is_access_revoked(self.employee))


class SyncEmployeeLifecycleTests(TestCase):
    def setUp(self):
        self.employee = make_employee()

    @patch("offboarding.models.is_access_revoked")
    def test_final_clearance_marks_employee_inactive(self, mock_revoked):
        mock_revoked.return_value = True
        checklist = OffboardingChecklist.objects.create(
            employee=self.employee,
            asset_recovery_status=True,
            manager_clearance_status=True,
            hr_clearance_status=True,
            final_clearance_status=True,
        )

        sync_employee_lifecycle_from_checklist(checklist)
        self.employee.refresh_from_db()

        self.assertEqual(self.employee.current_status, "inactive")
        self.assertIsNotNone(self.employee.exit_date)
        self.assertIsNotNone(self.employee.last_working_date)

    @patch("offboarding.models.is_access_revoked")
    def test_resignation_date_sets_notice_period_start_once(
        self, mock_revoked
    ):
        mock_revoked.return_value = False
        checklist = OffboardingChecklist.objects.create(
            employee=self.employee,
            resignation_date="2026-08-01",
        )

        sync_employee_lifecycle_from_checklist(checklist)
        self.employee.refresh_from_db()

        self.assertEqual(
            str(self.employee.notice_period_start_date), "2026-08-01"
        )

    @patch("offboarding.models.is_access_revoked")
    def test_no_changes_does_not_touch_employee(self, mock_revoked):
        mock_revoked.return_value = False
        checklist = OffboardingChecklist.objects.create(employee=self.employee)
        original_status = self.employee.current_status

        sync_employee_lifecycle_from_checklist(checklist)
        self.employee.refresh_from_db()

        self.assertEqual(self.employee.current_status, original_status)


class IsManagersTeamMemberTests(TestCase):
    def setUp(self):
        self.manager_user = User.objects.create_user(
            username="mgr", password="test123", role="manager"
        )
        self.other_manager_user = User.objects.create_user(
            username="mgr2", password="test123", role="manager"
        )
        self.manager_employee = make_employee(
            user=self.manager_user, employee_id="MGR001",
            current_status="active",
        )
        self.team_member = make_employee(
            employee_id="EMP102",
            reporting_manager=self.manager_employee,
        )

    def test_true_for_actual_team_member(self):
        self.assertTrue(
            is_managers_team_member(self.manager_user, self.team_member.id)
        )

    def test_false_for_non_team_member(self):
        self.assertFalse(
            is_managers_team_member(
                self.other_manager_user, self.team_member.id
            )
        )


class SyncChecklistFromTaskCompletionTests(TestCase):
    def setUp(self):
        self.employee = make_employee()

    @patch("offboarding.models.is_access_revoked")
    def test_task_completion_sets_corresponding_field(self, mock_revoked):
        mock_revoked.return_value = False
        checklist = OffboardingChecklist.objects.create(employee=self.employee)
        task = OffboardingTask.objects.create(
            employee=self.employee,
            task_name="Manager sign-off and handover",
            assigned_to_role="manager",
            status="completed",
        )

        result = sync_checklist_from_task_completion(task, checklist)
        self.assertTrue(result.manager_clearance_status)

    @patch("offboarding.models.is_access_revoked")
    def test_unrelated_task_name_does_not_crash_or_change_fields(
        self, mock_revoked
    ):
        mock_revoked.return_value = False
        checklist = OffboardingChecklist.objects.create(employee=self.employee)
        task = OffboardingTask.objects.create(
            employee=self.employee,
            task_name="Some custom task not in the mapping",
            assigned_to_role="hr",
            status="completed",
        )

        result = sync_checklist_from_task_completion(task, checklist)
        self.assertFalse(result.hr_clearance_status)

    @patch("offboarding.models.is_access_revoked")
    def test_final_clearance_auto_set_when_all_four_complete(
        self, mock_revoked
    ):
        mock_revoked.return_value = True
        checklist = OffboardingChecklist.objects.create(
            employee=self.employee,
            asset_recovery_status=True,
            access_revocation_status=True,
            hr_clearance_status=True,
        )
        task = OffboardingTask.objects.create(
            employee=self.employee,
            task_name="Manager sign-off and handover",
            assigned_to_role="manager",
            status="completed",
        )

        result = sync_checklist_from_task_completion(task, checklist)
        self.assertTrue(result.final_clearance_status)

    @patch("offboarding.models.is_access_revoked")
    def test_access_revocation_field_reflects_live_check_after_save(
        self, mock_revoked
    ):
        mock_revoked.return_value = False
        checklist = OffboardingChecklist.objects.create(employee=self.employee)
        task = OffboardingTask.objects.create(
            employee=self.employee,
            task_name="Revoke system and email access",
            assigned_to_role="it",
            status="completed",
        )

        result = sync_checklist_from_task_completion(task, checklist)
        self.assertFalse(result.access_revocation_status)


class OffboardingChecklistModelTests(TestCase):
    def setUp(self):
        self.employee = make_employee()

    @patch("offboarding.models.is_access_revoked")
    def test_completion_percentage_zero_when_nothing_done(self, mock_revoked):
        mock_revoked.return_value = False
        checklist = OffboardingChecklist.objects.create(employee=self.employee)

        self.assertEqual(checklist.offboarding_completion_percentage, 0)
        self.assertFalse(checklist.access_revocation_status)

    @patch("offboarding.models.is_access_revoked")
    def test_completion_percentage_partial(self, mock_revoked):
        mock_revoked.return_value = True
        checklist = OffboardingChecklist.objects.create(
            employee=self.employee,
            asset_recovery_status=True,
            manager_clearance_status=True,
        )

        self.assertEqual(checklist.offboarding_completion_percentage, 50)

    @patch("offboarding.models.is_access_revoked")
    def test_access_revocation_status_always_overridden_by_save(
        self, mock_revoked
    ):
        mock_revoked.return_value = False
        checklist = OffboardingChecklist(
            employee=self.employee, access_revocation_status=True,
        )
        checklist.save()

        self.assertFalse(checklist.access_revocation_status)


class OffboardingChecklistUpdateSerializerTests(TestCase):
    def setUp(self):
        self.employee = make_employee()

    @patch("offboarding.serializers.is_access_revoked")
    def test_final_clearance_rejected_if_access_not_revoked(
        self, mock_revoked
    ):
        mock_revoked.return_value = False
        instance = OffboardingChecklist.objects.create(
            employee=self.employee,
            asset_recovery_status=True,
            manager_clearance_status=True,
            hr_clearance_status=True,
        )

        serializer = OffboardingChecklistUpdateSerializer(
            instance=instance,
            data={"final_clearance_status": True},
            partial=True,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("final_clearance_status", serializer.errors)

    @patch("offboarding.serializers.is_access_revoked")
    def test_final_clearance_accepted_when_all_conditions_met(
        self, mock_revoked
    ):
        mock_revoked.return_value = True
        instance = OffboardingChecklist.objects.create(
            employee=self.employee,
            asset_recovery_status=True,
            manager_clearance_status=True,
            hr_clearance_status=True,
        )

        serializer = OffboardingChecklistUpdateSerializer(
            instance=instance,
            data={"final_clearance_status": True},
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    @patch("offboarding.serializers.is_access_revoked")
    def test_final_clearance_lists_missing_fields_in_error(
        self, mock_revoked
    ):
        mock_revoked.return_value = True
        instance = OffboardingChecklist.objects.create(
            employee=self.employee,
            asset_recovery_status=True,
            manager_clearance_status=True,
        )

        serializer = OffboardingChecklistUpdateSerializer(
            instance=instance,
            data={"final_clearance_status": True},
            partial=True,
        )

        self.assertFalse(serializer.is_valid())
        error_msg = str(serializer.errors["final_clearance_status"])
        self.assertIn("HR Clearance", error_msg)
