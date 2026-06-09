from rest_framework import serializers
from .models import Document
from employees.serializers import EmployeeListSerializer
from users.serializers import UserSerializer


class DocumentSerializer(serializers.ModelSerializer):
    employee = EmployeeListSerializer(read_only=True)
    verified_by = UserSerializer(read_only=True)

    class Meta:
        model = Document
        fields = [
            'id', 'employee', 'document_type', 'document_file',
            'verification_status', 'verified_by', 'verified_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DocumentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            'employee', 'document_type', 'document_file',
        ]


class DocumentVerifySerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            'verification_status', 'verified_by', 'verified_at',
        ]