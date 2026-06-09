from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLES = [
        ('hr', 'HR'),
        ('employee', 'Employee'),
        ('manager', 'Manager'),
        ('it', 'IT Admin'),
        ('superadmin', 'Super Admin'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLES,
        default='employee'
    )

    first_name = None
    last_name = None

    def __str__(self):
        return f"{self.username} ({self.role})"
