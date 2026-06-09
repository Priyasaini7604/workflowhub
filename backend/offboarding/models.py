from django.db import models
from employees.models import Employee
from users.models import User


class OffboardingTask(models.Model):

    # --- Choices ---
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    ASSIGNED_TO_CHOICES = [
        ('hr', 'HR'),
        ('it', 'IT Admin'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    ]

    # --- Task Information ---
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='offboarding_tasks'
    )
    task_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    assigned_to_role = models.CharField(
        max_length=20,
        choices=ASSIGNED_TO_CHOICES
    )
    due_date = models.DateField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    completed_at = models.DateTimeField(blank=True, null=True)
    completed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='completed_offboarding_tasks'
    )

    # --- Audit Information ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # soft Delete-----
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.employee} - {self.task_name}"


class OffboardingChecklist(models.Model):

    EXIT_REASON_CHOICES = [
        ('resignation', 'Resignation'),
        ('termination', 'Termination'),
        ('contract_end', 'Contract End'),
        ('retirement', 'Retirement'),
    ]

    EXIT_INTERVIEW_CHOICES = [
        ('pending', 'Pending'),
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('waived', 'Waived'),
    ]

    # --- Offboarding Information ---
    employee = models.OneToOneField(
        Employee,
        on_delete=models.CASCADE,
        related_name='offboarding_checklist'
    )
    resignation_date = models.DateField(blank=True, null=True)
    exit_reason = models.CharField(
        max_length=20,
        choices=EXIT_REASON_CHOICES,
        blank=True
    )
    exit_interview_status = models.CharField(
        max_length=20,
        choices=EXIT_INTERVIEW_CHOICES,
        default='pending'
    )
    asset_recovery_status = models.BooleanField(default=False)
    access_revocation_status = models.BooleanField(default=False)
    manager_clearance_status = models.BooleanField(default=False)
    hr_clearance_status = models.BooleanField(default=False)
    final_clearance_status = models.BooleanField(default=False)

    # --- Audit Information ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ---soft Delete-----
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.employee} - Offboarding Checklist"
