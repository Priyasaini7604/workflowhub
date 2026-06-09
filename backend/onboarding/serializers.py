from rest_framework import serializers
from .models import OnboardingTask, OnboardingChecklist
from employees.serializers import EmployeeListSerializer
from users.serializers import UserSerializer


class OnboardingTaskSerializer(serializers.ModelSerializer):
    employee = EmployeeListSerializer(read_only=True)
    completed_by = UserSerializer(read_only=True)

    class Meta:
        model = OnboardingTask
        fields = [
            'id', 'employee', 'task_name', 'description',
            'assigned_to_role', 'due_date', 'status',
            'completed_at', 'completed_by',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class OnboardingTaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingTask
        fields = [
            'employee', 'task_name', 'description',
            'assigned_to_role', 'due_date', 'status',
            
        ]


class OnboardingChecklistSerializer(serializers.ModelSerializer):
    employee = EmployeeListSerializer(read_only=True)

    class Meta:
        model = OnboardingChecklist
        fields = [
            'id', 'employee',
            'offer_letter_uploaded', 'documents_submitted',
            'documents_verified', 'background_verification_status',
            'induction_completed', 'onboarding_completion_percentage',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class OnboardingChecklistUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingChecklist
        fields = [
            'offer_letter_uploaded', 'documents_submitted',
            'documents_verified', 'background_verification_status',
            'induction_completed', 'onboarding_completion_percentage',
        ]