from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404
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
from .services import (
    sync_employee_lifecycle_from_checklist,
    is_managers_team_member,
    sync_checklist_from_task_completion,
    notify_task_completed,
    create_default_offboarding_tasks,
    notify_offboarding_started,
)
from permissions import IsHROrSuperAdmin, IsHROrManagerOrSuperAdmin


OFFBOARDING_ELIGIBLE_STATUSES = ['notice_period', 'offboarding', 'exited']


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

        # IT Admin → only IT-related tasks
        elif user.role == 'it':
            return OffboardingTask.objects.filter(
                employee=employee_id,
                assigned_to_role='it',
                is_archived=False
            )

        # Manager → only manager-tasks for their own team's employees
        elif user.role == 'manager':
            if not is_managers_team_member(user, employee_id):
                return OffboardingTask.objects.none()
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
            description=(
                f'Offboarding task "{task.task_name}" created '
                f'for {task.employee}'
            ),
            request=self.request
        )


# Offboarding Task Update
class OffboardingTaskUpdateView(generics.UpdateAPIView):
    serializer_class = OffboardingTaskCreateSerializer
    permission_classes = [IsHROrManagerOrSuperAdmin]

    def get_queryset(self):
        user = self.request.user
        base = OffboardingTask.objects.filter(is_archived=False)

        if user.role == 'manager':
            # Manager can only update tasks assigned to the manager role,
            # and only for employees who report to them.
            return base.filter(
                assigned_to_role='manager',
                employee__reporting_manager__user=user
            )

        return base

    def perform_update(self, serializer):
        task = serializer.save()
        create_audit_log(
            user=self.request.user,
            action='update',
            model_name='OffboardingTask',
            object_id=task.id,
            description=(
                f'Offboarding task "{task.task_name}" marked '
                f'as {task.status}'
            ),
            request=self.request
        )

        checklist, _ = OffboardingChecklist.objects.get_or_create(
            employee=task.employee
        )
        checklist = sync_checklist_from_task_completion(task, checklist)
        sync_employee_lifecycle_from_checklist(checklist)

        if task.status == 'completed':
            notify_task_completed(task)


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
        user = self.request.user
        employee_id = self.kwargs.get('employee_id')

        if user.role == 'manager' and not is_managers_team_member(
                user, employee_id):
            raise PermissionDenied(
                "You can only view offboarding data for your own "
                "team members."
            )

        # Only enforce the status check when a checklist doesn't exist
        # yet — once offboarding has started, the employee's status may
        # keep changing (notice_period -> offboarding -> exited/inactive),
        # and the existing checklist should still be viewable regardless.
        checklist_exists = OffboardingChecklist.objects.filter(
            employee_id=employee_id
        ).exists()

        if not checklist_exists:
            employee = get_object_or_404(Employee, pk=employee_id)
            if employee.current_status not in OFFBOARDING_ELIGIBLE_STATUSES:
                raise ValidationError(
                    f"{employee} is currently '{employee.current_status}' "
                    "— offboarding can only be started once an employee "
                    "is in notice period."
                )

        checklist, created = OffboardingChecklist.objects.get_or_create(
            employee_id=employee_id
        )
        if created:
            create_default_offboarding_tasks(employee_id)
            notify_offboarding_started(checklist.employee)

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
            description=(
                f'Offboarding checklist updated for {checklist.employee}'
            ),
            request=self.request
        )
        sync_employee_lifecycle_from_checklist(checklist)
