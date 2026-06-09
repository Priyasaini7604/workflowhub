from django.db import models
from employees.models import Employee


class Asset(models.Model):

    # --- Choices ---
    ASSET_TYPE_CHOICES = [
        ('laptop', 'Laptop'),
        ('monitor', 'Monitor'),
        ('keyboard', 'Keyboard'),
        ('mouse', 'Mouse'),
        ('headset', 'Headset'),
        ('mobile', 'Mobile Device'),
        ('other', 'Other'),
    ]

    ASSET_STATUS_CHOICES = [
        ('available', 'Available'),
        ('assigned', 'Assigned'),
        ('under_repair', 'Under Repair'),
        ('retired', 'Retired'),
    ]

    # --- Asset Information ---
    asset_id = models.CharField(max_length=20, unique=True)
    asset_type = models.CharField(
        max_length=20,
        choices=ASSET_TYPE_CHOICES
    )
    brand = models.CharField(max_length=100, blank=True)
    model_name = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, unique=True, blank=True)

    # --- Assignment Information ---
    assigned_to = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_assets'
    )
    asset_issue_date = models.DateField(blank=True, null=True)
    asset_return_date = models.DateField(blank=True, null=True)

    status = models.CharField(
        max_length=20,
        choices=ASSET_STATUS_CHOICES,
        default='available'
    )

    # --- Audit Information ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.asset_type} - {self.asset_id}"
