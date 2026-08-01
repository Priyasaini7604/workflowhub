from django.db import models
from employees.models import Employee
from master_data.models import AssetCategory


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
        ('pending_acknowledgment', 'Pending Acknowledgment'),
        ('assigned', 'Assigned'),
        ('pending_return', 'Pending Return'),
        ('under_repair', 'Under Repair'),
        ('retired', 'Retired'),
    ]

    # --- Condition & Warranty ---
    CONDITION_CHOICES = [
        ('new', 'New'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('damaged', 'Damaged'),
    ]

    condition = models.CharField(
        max_length=20,
        choices=CONDITION_CHOICES,
        default='good'
    )
    warranty_expiry_date = models.DateField(blank=True, null=True)

    # --- Asset Information ---
    asset_id = models.CharField(max_length=20, unique=True)

    category = models.ForeignKey(
        AssetCategory,
        on_delete=models.PROTECT,
        related_name='assets'
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
        max_length=25,
        choices=ASSET_STATUS_CHOICES,
        default='available'
    )

    # Track the acknowledgment window

    acknowledgment_requested_at = models.DateTimeField(null=True, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)

    # --- Audit Information ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # --- Soft Delete ---
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['is_archived', 'status'],
                         name='asset_archived_status_idx'),
        ]

    def __str__(self):
        return f"{self.category} - {self.asset_id}"


class AssetAllocationHistory(models.Model):

    asset = models.ForeignKey(
        Asset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='allocation_history'
    )

    asset_id_snapshot = models.CharField(max_length=20, blank=True)
    asset_name_snapshot = models.CharField(max_length=255, blank=True)

    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='asset_allocation_history'
    )
    acknowledgment_status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('acknowledged',
                                          'Acknowledged'), ('rejected', 'Rejected')],
        default='pending'
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    assigned_date = models.DateField()
    returned_date = models.DateField(blank=True, null=True)
    assigned_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='allocations_made'
    )
    remarks = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.asset:
            self.asset_id_snapshot = self.asset.asset_id
            self.asset_name_snapshot = f"{
                self.asset.brand} {
                self.asset.model_name}".strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.asset} - {self.employee} ({self.assigned_date})"
