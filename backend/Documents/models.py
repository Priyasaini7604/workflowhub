from django.db import models
from employees.models import Employee
from users.models import User


class Document(models.Model):

    # --- Choices ---
    DOCUMENT_TYPE_CHOICES = [
        ('resume', 'Resume'),
        ('offer_letter', 'Offer Letter'),
        ('nda', 'NDA'),
        ('aadhaar', 'Aadhaar'),
        ('pan', 'PAN'),
        ('passport', 'Passport'),
        ('educational_certificate', 'Educational Certificate'),
        ('experience_certificate', 'Experience Certificate'),
        ('policy_acceptance', 'Policy Acceptance Form'),
        ('exit_document', 'Exit Document'),
        ('other', 'Other'),
    ]

    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]

    # --- Document Information ---
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    document_type = models.CharField(
        max_length=30,
        choices=DOCUMENT_TYPE_CHOICES
    )
    document_file = models.FileField(
        upload_to='documents/',
        blank=True,
        null=True
    )
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='pending'
    )
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_documents'
    )
    verified_at = models.DateTimeField(blank=True, null=True)

    # --- Audit Information ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee} - {self.document_type}"
