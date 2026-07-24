from rest_framework import serializers
from .models import SoftwareAccess
# tumhara existing cross-app serializer
from employees.serializers import EmployeeListSerializer


class SoftwareAccessSerializer(serializers.ModelSerializer):
    employee_detail = EmployeeListSerializer(source='employee', read_only=True)
    granted_by_name = serializers.CharField(
        source='granted_by.username', read_only=True)
    revoked_by_name = serializers.CharField(
        source='revoked_by.username', read_only=True)

    class Meta:
        model = SoftwareAccess
        fields = [
            'id', 'employee', 'employee_detail', 'software_name', 'access_level',
            'granted_on', 'granted_by', 'granted_by_name',
            'status', 'revoked_on', 'revoked_by', 'revoked_by_name',
            'is_archived', 'archived_at',
        ]
        read_only_fields = [
            'granted_on', 'revoked_on', 'granted_by', 'revoked_by',
            'is_archived', 'archived_at',
        ]


class SoftwareAccessCreateSerializer(serializers.ModelSerializer):
    """Used when granting access — only the necessary fields"""
    class Meta:
        model = SoftwareAccess
        fields = ['employee', 'software_name', 'access_level']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['granted_by'] = request.user if request else None
        validated_data['status'] = 'active'
        return super().create(validated_data)


class SoftwareAccessRevokeSerializer(serializers.ModelSerializer):
    """For revoking access — only touches the status field"""
    class Meta:
        model = SoftwareAccess
        fields = ['status']

    def validate_status(self, value):
        if value != 'revoked':
            raise serializers.ValidationError(
                "This endpoint is only for revoking access.")
        return value
