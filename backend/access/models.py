from django.db import models
from employees.models import Employee
from django.conf import settings


class SoftwareAccess(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('revoked', 'Revoked'),
        ('pending', 'Pending'),
    )

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='software_access')
    # e.g. "Gmail", "GitHub", "Slack"
    software_name = models.CharField(max_length=100)
    access_level = models.CharField(
        max_length=50, blank=True)  # e.g. "Admin", "Viewer"
    granted_on = models.DateTimeField(auto_now_add=True)
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='access_granted')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending')
    revoked_on = models.DateTimeField(null=True, blank=True)
    revoked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='access_revoked')

    # tumhare existing soft-delete pattern ke consistent
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='access_archived')


class Meta:
    ordering = ['-granted_on']
