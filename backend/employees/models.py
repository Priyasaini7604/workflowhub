from django.db import models
from django.core.validators import RegexValidator
from users.models import User


class Employee(models.Model):

    # --- Choices ---
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('O+', 'O+'), ('O-', 'O-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
    ]

    EMPLOYEE_TYPE_CHOICES = [
        ('permanent', 'Permanent'),
        ('contract', 'Contract'),
        ('intern', 'Intern'),
    ]

    WORK_MODE_CHOICES = [
        ('remote', 'Remote'),
        ('hybrid', 'Hybrid'),
        ('office', 'Office'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('on_leave', 'On Leave'),
    ]

    # --- Validators ---
    phone_validator = RegexValidator(
        regex=r'^\d{10,15}$',
        message='Mobile number 10 to 15 digits hona chahiye!'
    )

    # --- 1. Basic Information ---
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='employee_profile'
    )
    employee_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50)
    profile_photo = models.ImageField(
        upload_to='profile_photos/',
        blank=True,
        null=True
    )

    # --- 2. Personal Information ---
    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES,
        blank=True
    )
    date_of_birth = models.DateField(blank=True, null=True)
    blood_group = models.CharField(
        max_length=5,
        choices=BLOOD_GROUP_CHOICES,
        blank=True
    )

    # --- 3. Contact Information ---
    personal_email = models.EmailField(blank=True)
    official_email = models.EmailField(blank=True)
    mobile_number = models.CharField(
        max_length=15,
        validators=[phone_validator],
        blank=True
    )
    alternate_mobile_number = models.CharField(
        max_length=15,
        validators=[phone_validator],
        blank=True
    )
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_number = models.CharField(
        max_length=15,
        validators=[phone_validator],
        blank=True
    )
    emergency_contact_relationship = models.CharField(max_length=50, blank=True)

    # --- 4. Employment Information ---
    employee_type = models.CharField(
        max_length=20,
        choices=EMPLOYEE_TYPE_CHOICES,
        default='permanent'
    )
    designation = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    reporting_manager = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='team_members'
    )
    date_of_joining = models.DateField()
    confirmation_date = models.DateField(blank=True, null=True)
    probation_end_date = models.DateField(blank=True, null=True)

    # --- 5. Organizational Information ---
    work_mode = models.CharField(
        max_length=10,
        choices=WORK_MODE_CHOICES,
        default='office'
    )

    # --- 6. Lifecycle Information ---
    current_status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    status_start_date = models.DateField(blank=True, null=True)
    notice_period_start_date = models.DateField(blank=True, null=True)
    last_working_date = models.DateField(blank=True, null=True)
    exit_date = models.DateField(blank=True, null=True)

    # --- 13. Audit Information ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_employees'
    )
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_employees'
    )
    
    # --- Soft Delete ---
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='archived_employees'
    )

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.designation}"
