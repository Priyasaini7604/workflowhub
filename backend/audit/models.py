from django.db import models
from users.models import User


class AuditLog(models.Model):

    # --- Choices ---
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
    ]

    # --- Audit Information ---
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES
    )
    model_name = models.CharField(max_length=100)
    object_id = models.PositiveIntegerField()
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True
    )

    # --- Audit Information ---
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.action} - {self.model_name}"
