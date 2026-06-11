from rest_framework import serializers
from .models import AuditLog
from users.serializers import UserSerializer


class AuditLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'action', 'model_name',
            'object_id', 'description', 'ip_address',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class AuditLogCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            'user', 'action', 'model_name',
            'object_id', 'description', 'ip_address',
        ]
        read_only_fields = ['user']
