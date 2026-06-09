from django.contrib import admin
from .models import OffboardingTask, OffboardingChecklist

@admin.register(OffboardingTask)
class OffboardingTaskAdmin(admin.ModelAdmin):
    list_display = ['employee', 'task_name', 'assigned_to_role', 'status', 'due_date']

@admin.register(OffboardingChecklist)
class OffboardingChecklistAdmin(admin.ModelAdmin):
    list_display = ['employee', 'exit_reason', 'exit_interview_status', 'asset_recovery_status', 'final_clearance_status']
