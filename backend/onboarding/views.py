from rest_framework import generics, permissions
from django.utils import timezone
from audit.utils import create_audit_log
from .models import OnboardingTask, OnboardingChecklist
from .serializers import (
    OnboardingTaskSerializer,
    OnboardingTaskCreateSerializer,
    OnboardingTaskArchiveSerializer,
    OnboardingChecklistSerializer,
    OnboardingChecklistUpdateSerializer,
)
from permissions import IsHROrSuperAdmin, IsHROrManagerOrSuperAdmin

DEFAULT_ONBOARDING_TASKS = [
    ('Verify submitted documents', 'hr'),
    ('Conduct background verification', 'hr'),
    ('Setup IT assets (laptop, email, ID card)', 'it'),
    ('Complete policy acceptance form', 'employee'),
    ('Conduct induction session', 'hr'),
    ('Introduce to reporting manager and team', 'manager'),
]


# Onboarding Task List of Employees
class OnboardingTaskListView(generics.ListAPIView):
    serializer_class = OnboardingTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        employee_id = self.kwargs.get('employee_id')

        if user.role in ['hr', 'superadmin']:
            return OnboardingTask.objects.filter(
                employee=employee_id,
                is_archived=False
            )

        elif user.role == 'it':
            return OnboardingTask.objects.filter(
                employee=employee_id,
                assigned_to_role='it',
                is_archived=False
            )

        elif user.role == 'manager':
            return OnboardingTask.objects.filter(
                employee=employee_id,
                assigned_to_role='manager',
                is_archived=False
            )

        elif user.role == 'employee':
            return OnboardingTask.objects.filter(
                employee__user=user,
                is_archived=False
            )

        return OnboardingTask.objects.none()


# Onboarding Task Create
class OnboardingTaskCreateView(generics.CreateAPIView):
    queryset = OnboardingTask.objects.all()
    serializer_class = OnboardingTaskCreateSerializer
    permission_classes = [IsHROrSuperAdmin]

    def perform_create(self, serializer):
        task = serializer.save()
        create_audit_log(
            user=self.request.user,
            action='create',
            model_name='OnboardingTask',
            object_id=task.id,
            description=f'Onboarding task "{task.task_name}" created for {task.employee}',
            request=self.request
        )


# Onboarding Task Update
class OnboardingTaskUpdateView(generics.UpdateAPIView):
    serializer_class = OnboardingTaskCreateSerializer
    permission_classes = [IsHROrManagerOrSuperAdmin]

    def get_queryset(self):
        return OnboardingTask.objects.filter(is_archived=False)

    def perform_update(self, serializer):
        task = serializer.save()
        create_audit_log(
            user=self.request.user,
            action='update',
            model_name='OnboardingTask',
            object_id=task.id,
            description=f'Onboarding task "{task.task_name}" marked as {task.status}',
            request=self.request
        )
    
        # --- Sync specific tasks to checklist ---
        checklist, _ = OnboardingChecklist.objects.get_or_create(
            employee=task.employee
        )

        if task.task_name == 'Conduct induction session' and task.status == 'completed':
            checklist.induction_completed = True
            checklist.save()

        if task.task_name == 'Conduct background verification':
            # Mirror task status directly onto checklist (pending/in_progress/completed)
            # 'failed' is handled separately via manual override, not through task status
            checklist.background_verification_status = task.status
            checklist.save()


# Onboarding Task Archive-Soft Delete
class OnboardingTaskArchiveView(generics.UpdateAPIView):
    serializer_class = OnboardingTaskArchiveSerializer
    permission_classes = [IsHROrSuperAdmin]

    def get_queryset(self):
        return OnboardingTask.objects.filter(is_archived=False)

    def perform_update(self, serializer):
        task = serializer.save(
            is_archived=True,
            archived_at=timezone.now()
        )
        create_audit_log(
            user=self.request.user,
            action='delete',
            model_name='OnboardingTask',
            object_id=task.id,
            description=f'Onboarding task "{task.task_name}" archived',
            request=self.request
        )


# Onboarding Checklist
class OnboardingChecklistView(generics.RetrieveAPIView):
    serializer_class = OnboardingChecklistSerializer
    permission_classes = [IsHROrManagerOrSuperAdmin]

    def get_object(self):
        employee_id = self.kwargs.get('employee_id')
        checklist, created = OnboardingChecklist.objects.get_or_create(
            employee_id=employee_id
        )
        if created:
            OnboardingTask.objects.bulk_create([
                OnboardingTask(
                    employee_id=employee_id,
                    task_name=name,
                    assigned_to_role=role,
                )
                for name, role in DEFAULT_ONBOARDING_TASKS
            ])
        return checklist

# Onboarding Checklist Update
class OnboardingChecklistUpdateView(generics.UpdateAPIView):
    queryset = OnboardingChecklist.objects.all()
    serializer_class = OnboardingChecklistUpdateSerializer
    permission_classes = [IsHROrSuperAdmin]

    def perform_update(self, serializer):
        checklist = serializer.save()
        create_audit_log(
            user=self.request.user,
            action='update',
            model_name='OnboardingChecklist',
            object_id=checklist.id,
            description=f'Onboarding checklist updated for {checklist.employee}',
            request=self.request
        )
