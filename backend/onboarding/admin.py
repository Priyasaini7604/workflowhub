from django.contrib import admin
from .models import OnboardingTask, OnboardingChecklist


@admin.register(OnboardingTask)
class OnboardingTaskAdmin(admin.ModelAdmin):
    list_display = ['employee', 'task_name', 'assigned_to_role', 'status', 'due_date']


@admin.register(OnboardingChecklist)
class OnboardingChecklistAdmin(admin.ModelAdmin):
    list_display = ['employee', 'documents_submitted', 'documents_verified',
                    'induction_completed', 'onboarding_completion_percentage']
