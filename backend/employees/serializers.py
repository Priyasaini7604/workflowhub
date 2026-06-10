from rest_framework import serializers
from .models import Employee
from users.serializers import UserSerializer


class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
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
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        if obj.middle_name:
            return f"{obj.first_name} {obj.middle_name} {obj.last_name}"
        return f"{obj.first_name} {obj.last_name}"


class EmployeeListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id',
            'employee_id',
            'full_name',
            'department',
            'designation',
            'current_status',
            'date_of_joining',
        ]

    def get_full_name(self, obj):
        if obj.middle_name:
            return f"{obj.first_name} {obj.middle_name} {obj.last_name}"
        return f"{obj.first_name} {obj.last_name}"


class EmployeeArchiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['is_archived', 'archived_at', 'archived_by']
