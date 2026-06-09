from django.db import models
from employees.models import Employee
from users.models import User


class OnboardingTask(models.Model):

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
        related_name='onboarding_tasks'
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
        related_name='completed_onboarding_tasks'
    )

    # --- Audit Information ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee} - {self.task_name}"


class OnboardingChecklist(models.Model):

    # --- Checklist Information ---
    employee = models.OneToOneField(
        Employee,
        on_delete=models.CASCADE,
        related_name='onboarding_checklist'
    )
    offer_letter_uploaded = models.BooleanField(default=False)
    documents_submitted = models.BooleanField(default=False)
    documents_verified = models.BooleanField(default=False)
    background_verification_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ],
        default='pending'
    )
    induction_completed = models.BooleanField(default=False)
    onboarding_completion_percentage = models.IntegerField(default=0)

    # --- Audit Information ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # ----soft Delete----
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.employee} - Onboarding Checklist"

# Create your models here.
