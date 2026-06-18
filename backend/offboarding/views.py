from rest_framework import generics, permissions
from django.utils import timezone
from audit.utils import create_audit_log
from .models import OffboardingTask, OffboardingChecklist
from .serializers import (
    OffboardingTaskSerializer,
    OffboardingTaskCreateSerializer,
    OffboardingTaskArchiveSerializer,
    OffboardingChecklistSerializer,
    OffboardingChecklistUpdateSerializer,
)
from permissions import IsHROrSuperAdmin, IsHROrManagerOrSuperAdmin


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
            description=f'Offboarding task "{task.task_name}" created for {task.employee}',
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
            description=f'Offboarding task "{task.task_name}" updated',
            request=self.request
        )


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
        return OffboardingChecklist.objects.get(employee=employee_id)


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
            description=f'Offboarding checklist updated for {checklist.employee}',
            request=self.request
        )
