from rest_framework import serializers
from .models import OffboardingTask, OffboardingChecklist
from employees.serializers import EmployeeListSerializer
from users.serializers import UserSerializer


class OffboardingTaskSerializer(serializers.ModelSerializer):
    employee = EmployeeListSerializer(read_only=True)
    completed_by = UserSerializer(read_only=True)

    class Meta:
        model = OffboardingTask
        fields = [
            'id', 'employee', 'task_name', 'description',
            'assigned_to_role', 'due_date', 'status',
            'completed_at', 'completed_by',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class OffboardingTaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OffboardingTask
        fields = [
            'employee', 'task_name', 'description',
            'assigned_to_role', 'due_date', 'status',
        ]


class OffboardingChecklistSerializer(serializers.ModelSerializer):
    employee = EmployeeListSerializer(read_only=True)

    class Meta:
        model = OffboardingChecklist
        fields = [
            'id', 'employee',
            'resignation_date', 'exit_reason', 'exit_interview_status',
            'asset_recovery_status', 'access_revocation_status',
            'manager_clearance_status', 'hr_clearance_status',
            'final_clearance_status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class OffboardingChecklistUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OffboardingChecklist
        fields = [
            'resignation_date', 'exit_reason', 'exit_interview_status',
            'asset_recovery_status', 'access_revocation_status',
            'manager_clearance_status', 'hr_clearance_status',
            'final_clearance_status',
        ]

class OffboardingTaskArchiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = OffboardingTask
        fields = ['is_archived', 'archived_at']
