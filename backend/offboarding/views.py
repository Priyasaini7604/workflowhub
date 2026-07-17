from rest_framework import generics, permissions
from django.utils import timezone
from audit.utils import create_audit_log
from employees.models import Employee
from .models import OffboardingTask, OffboardingChecklist
from .serializers import (
    OffboardingTaskSerializer,
    OffboardingTaskCreateSerializer,
    OffboardingTaskArchiveSerializer,
    OffboardingChecklistSerializer,
    OffboardingChecklistUpdateSerializer,
)
from permissions import IsHROrSuperAdmin, IsHROrManagerOrSuperAdmin


def sync_employee_lifecycle_from_checklist(checklist):
    """Keep Employee lifecycle fields in sync with the offboarding checklist,
    so HR doesn't have to manually re-type the same dates in Edit Employee."""
    employee = checklist.employee
    today = timezone.now().date()
    changed = False

    if checklist.resignation_date and not employee.notice_period_start_date:
        employee.notice_period_start_date = checklist.resignation_date
        changed = True

    if checklist.final_clearance_status and employee.current_status != 'inactive':
        employee.last_working_date = today
        employee.exit_date = today
        employee.current_status = 'inactive'
        employee.status_start_date = today
        changed = True

    if changed:
        employee.save()


DEFAULT_OFFBOARDING_TASKS = [
    ('Recover company laptop and IT assets', 'it'),
    ('Revoke system and email access', 'it'),
    ('Conduct exit interview', 'hr'),
    ('Manager sign-off and handover', 'manager'),
    ('Complete HR final settlement clearance', 'hr'),
]


# Offboarding Task List — Role based
class OffboardingTaskListView(generics.ListAPIView):
    serializer_class = OffboardingTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        employee_id = self.kwargs.get('employee_id')

        # HR, SuperAdmin
        if user.role in ['hr', 'superadmin']:
            return OffboardingTask.objects.filter(
                employee=employee_id,
                is_archived=False
            )

        # IT Admin → Sirf IT related tasks
        elif user.role == 'it':
            return OffboardingTask.objects.filter(
                employee=employee_id,
                assigned_to_role='it',
                is_archived=False
            )

        # Manager
        elif user.role == 'manager':
            return OffboardingTask.objects.filter(
                employee=employee_id,
                assigned_to_role='manager',
                is_archived=False
            )

        # Employee
        elif user.role == 'employee':
            return OffboardingTask.objects.filter(
                employee__user=user,
                is_archived=False
            )

        return OffboardingTask.objects.none()


# Offboarding Task Create
class OffboardingTaskCreateView(generics.CreateAPIView):
    queryset = OffboardingTask.objects.all()
    serializer_class = OffboardingTaskCreateSerializer
    permission_classes = [IsHROrSuperAdmin]

    def perform_create(self, serializer):
        task = serializer.save()
        create_audit_log(
            user=self.request.user,
            action='create',
            model_name='OffboardingTask',
            object_id=task.id,
            description=f'Offboarding task "{
                task.task_name}" created for {
                task.employee}',
            request=self.request
        )


# Offboarding Task Update
class OffboardingTaskUpdateView(generics.UpdateAPIView):
    serializer_class = OffboardingTaskCreateSerializer
    permission_classes = [IsHROrManagerOrSuperAdmin]

    def get_queryset(self):
        return OffboardingTask.objects.filter(is_archived=False)

    def perform_update(self, serializer):
        task = serializer.save()
        create_audit_log(
            user=self.request.user,
            action='update',
            model_name='OffboardingTask',
            object_id=task.id,
            description=f'Offboarding task "{
                task.task_name}" marked as {
                task.status}',
            request=self.request
        )

        checklist, _ = OffboardingChecklist.objects.get_or_create(
            employee=task.employee
        )

        if task.status == 'completed':
            if task.task_name == 'Recover company laptop and IT assets':
                checklist.asset_recovery_status = True
            elif task.task_name == 'Revoke system and email access':
                checklist.access_revocation_status = True
            elif task.task_name == 'Conduct exit interview':
                checklist.exit_interview_status = 'completed'
            elif task.task_name == 'Manager sign-off and handover':
                checklist.manager_clearance_status = True
            elif task.task_name == 'Complete HR final settlement clearance':
                checklist.hr_clearance_status = True

        # Final clearance auto-derives once the four operational clearances are
        # done
        if (checklist.asset_recovery_status and checklist.access_revocation_status
                and checklist.manager_clearance_status and checklist.hr_clearance_status):
            checklist.final_clearance_status = True

        checklist.save()
        sync_employee_lifecycle_from_checklist(checklist)


# Offboarding Task Archive — Soft Delete
class OffboardingTaskArchiveView(generics.UpdateAPIView):
    serializer_class = OffboardingTaskArchiveSerializer
    permission_classes = [IsHROrSuperAdmin]

    def get_queryset(self):
        return OffboardingTask.objects.filter(is_archived=False)

    def perform_update(self, serializer):
        task = serializer.save(
            is_archived=True,
            archived_at=timezone.now()
        )
        create_audit_log(
            user=self.request.user,
            action='delete',
            model_name='OffboardingTask',
            object_id=task.id,
            description=f'Offboarding task "{task.task_name}" archived',
            request=self.request
        )


# Offboarding Checklist
class OffboardingChecklistView(generics.RetrieveAPIView):
    serializer_class = OffboardingChecklistSerializer
    permission_classes = [IsHROrManagerOrSuperAdmin]

    def get_object(self):
        employee_id = self.kwargs.get('employee_id')
        checklist, created = OffboardingChecklist.objects.get_or_create(
            employee_id=employee_id
        )
        if created:
            OffboardingTask.objects.bulk_create([
                OffboardingTask(
                    employee_id=employee_id,
                    task_name=name,
                    assigned_to_role=role,
                )
                for name, role in DEFAULT_OFFBOARDING_TASKS
            ])
        return checklist


# Offboarding Checklist Update
class OffboardingChecklistUpdateView(generics.UpdateAPIView):
    queryset = OffboardingChecklist.objects.all()
    serializer_class = OffboardingChecklistUpdateSerializer
    permission_classes = [IsHROrSuperAdmin]

    def perform_update(self, serializer):
        checklist = serializer.save()
        create_audit_log(
            user=self.request.user,
            action='update',
            model_name='OffboardingChecklist',
            object_id=checklist.id,
            description=f'Offboarding checklist updated for {
                checklist.employee}',
            request=self.request
        )
        sync_employee_lifecycle_from_checklist(checklist)
