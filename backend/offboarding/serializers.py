from rest_framework import serializers
from .models import OffboardingTask, OffboardingChecklist
from .services import is_access_revoked
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
            'final_clearance_status', 'offboarding_completion_percentage',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id',
            'offboarding_completion_percentage',
            'created_at',
            'updated_at']


class OffboardingChecklistUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OffboardingChecklist
        fields = [
            'resignation_date', 'exit_reason', 'exit_interview_status',
            'asset_recovery_status', 'access_revocation_status',
            'manager_clearance_status', 'hr_clearance_status',
            'final_clearance_status', 'offboarding_completion_percentage',
        ]
        # this field is now computed by the model itself — never
        # accept it from the request
        read_only_fields = [
            'access_revocation_status',
            'offboarding_completion_percentage']

    def validate(self, data):
        final_clearance = data.get(
            'final_clearance_status',
            getattr(self.instance, 'final_clearance_status', False)
        )

        if final_clearance:
            employee = self.instance.employee if self.instance else None
            access_clear = is_access_revoked(employee) if employee else True

            required_fields = {
                'Asset Recovery': data.get(
                    'asset_recovery_status',
                    getattr(self.instance, 'asset_recovery_status', False)
                ),
                'Access Revocation': access_clear,
                'Manager Clearance': data.get(
                    'manager_clearance_status',
                    getattr(self.instance, 'manager_clearance_status', False)
                ),
                'HR Clearance': data.get(
                    'hr_clearance_status',
                    getattr(self.instance, 'hr_clearance_status', False)
                ),
            }
            incomplete = [
                name for name,
                status in required_fields.items() if not status]

            if incomplete:
                raise serializers.ValidationError({
                    'final_clearance_status': (
                        "Cannot mark final clearance until these are "
                        f"completed: {', '.join(incomplete)}"
                    )
                })

        return data


class OffboardingTaskArchiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = OffboardingTask
        fields = ['is_archived', 'archived_at']
