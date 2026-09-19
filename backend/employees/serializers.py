from rest_framework import serializers
from .models import Employee
from users.models import User


class EmployeeSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id',
            'user',
            'full_name',
            'employee_id',
            'first_name',
            'middle_name',
            'last_name',
            'profile_photo',
            'gender',
            'date_of_birth',
            'blood_group',
            'personal_email',
            'official_email',
            'mobile_number',
            'alternate_mobile_number',
            'emergency_contact_name',
            'emergency_contact_number',
            'emergency_contact_relationship',
            'employee_type',
            'designation',
            'department',
            'reporting_manager',
            'date_of_joining',
            'confirmation_date',
            'probation_end_date',
            'work_mode',
            'current_status',
            'status_start_date',
            'notice_period_start_date',
            'last_working_date',
            'exit_date',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'is_archived', 'archived_at'
        ]
        read_only_fields = [
            'id',
            'employee_id',
            'created_at',
            'updated_at',
            'is_archived',
            'archived_at']

    def get_full_name(self, obj):
        if obj.middle_name:
            return f"{obj.first_name} {obj.middle_name} {obj.last_name}"
        return f"{obj.first_name} {obj.last_name}"


class EmployeeListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    # role lives on the linked User account, not on Employee itself —
    # pull it through so the frontend can show it (HR/Manager/IT/etc).
    # Candidates have no linked User yet, so this must stay null-safe.
    role = serializers.SerializerMethodField()

    def get_role(self, obj):
        return obj.user.role if obj.user else None

    class Meta:
        model = Employee
        fields = [
            'id',
            'employee_id',
            'full_name',
            'department',
            'designation',
            'role',
            'current_status',
            'date_of_joining',
            # Needed so the frontend can filter "my team" by matching this
            # against the logged-in manager's own employee id. Without it,
            # every manager's team always shows up empty.
            'reporting_manager',
        ]

    def get_full_name(self, obj):
        if obj.middle_name:
            return f"{obj.first_name} {obj.middle_name} {obj.last_name}"
        return f"{obj.first_name} {obj.last_name}"


class EmployeeArchiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['is_archived', 'archived_at', 'archived_by']


class EmployeeReportSerializer(serializers.ModelSerializer):
    department = serializers.CharField()
    designation = serializers.CharField()
    manager_name = serializers.SerializerMethodField()
    asset_count = serializers.SerializerMethodField()
    onboarding_percentage = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'employee_id', 'full_name', 'department', 'designation',
            'current_status', 'status_start_date', 'onboarding_percentage',
            'asset_count', 'manager_name', 'employee_type', 'date_of_joining',
        ]

    def get_full_name(self, obj):
        if obj.middle_name:
            return f"{obj.first_name} {obj.middle_name} {obj.last_name}"
        return f"{obj.first_name} {obj.last_name}"

    def get_manager_name(self, obj):
        if obj.reporting_manager:
            return f"{
                obj.reporting_manager.first_name} {
                obj.reporting_manager.last_name}"
        return None

    def get_asset_count(self, obj):
        return obj.assigned_assets.filter(is_archived=False).count()

    def get_onboarding_percentage(self, obj):
        if hasattr(obj, 'onboarding_checklist'):
            return obj.onboarding_checklist.onboarding_completion_percentage
        return 0


class EmployeeStatusUpdateSerializer(serializers.Serializer):
    new_status = serializers.ChoiceField(choices=Employee.STATUS_CHOICES)

    # Valid transitions
    VALID_TRANSITIONS = {
        'candidate': ['offer_sent'],
        'offer_sent': ['joining_pending'],
        'joining_pending': ['onboarding'],
        'onboarding': ['active'],
        'active': ['notice_period'],
        'notice_period': ['offboarding'],
        'offboarding': ['exited'],
        'exited': [],
    }

    def validate_new_status(self, value):
        employee = self.context['employee']
        current = employee.current_status

        allowed_next = self.VALID_TRANSITIONS.get(current, [])
        if value not in allowed_next:
            raise serializers.ValidationError(
                f"Cannot change status from '{current}' to '{value}'. "
                f"Allowed next status: {allowed_next or 'none'}"
            )
        return value


class CandidateCreateSerializer(serializers.ModelSerializer):
    """Minimal intake form for the Candidate stage — no user account,
    no employee_id yet. Those get created only once the candidate
    is moved to joining_pending."""

    class Meta:
        model = Employee
        fields = [
            'id',
            'first_name',
            'middle_name',
            'last_name',
            'personal_email',
            'mobile_number',
            'designation',
            'department',
        ]
