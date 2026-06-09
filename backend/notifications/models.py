from django.db import models
from users.models import User
from employees.models import Employee


class Notification(models.Model):

    # --- Choices ---
    NOTIFICATION_TYPE_CHOICES = [
        ('onboarding', 'Onboarding'),
        ('offboarding', 'Offboarding'),
        ('asset', 'Asset'),
        ('task', 'Task'),
        ('general', 'General'),
    ]

    # --- Notification Information ---
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPE_CHOICES,
        default='general'
    )
    is_read = models.BooleanField(default=False)

    # --- Audit Information ---
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.recipient} - {self.title}"

# Create your models here.
