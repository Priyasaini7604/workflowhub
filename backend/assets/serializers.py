from rest_framework import serializers
from .models import Asset
from employees.serializers import EmployeeListSerializer


class AssetSerializer(serializers.ModelSerializer):
    assigned_to = EmployeeListSerializer(read_only=True)

    class Meta:
        model = Asset
        fields = [
            'id', 'asset_id', 'asset_type', 'brand', 'model_name', 'serial_number',
            'assigned_to', 'asset_issue_date', 'asset_return_date',
            'status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AssetCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = [
            'asset_id', 'asset_type', 'brand', 'model_name', 'serial_number',
            'assigned_to', 'asset_issue_date', 'asset_return_date', 'status',
        ]

    def validate_asset_id(self, value):
        if Asset.objects.filter(asset_id=value).exists():
            raise serializers.ValidationError("This Asset ID is already exists!")
        return value

    def validate_serial_number(self, value):
        if value and Asset.objects.filter(serial_number=value).exists():
            raise serializers.ValidationError("This Serial Number is already exists!")
        return value


class AssetArchiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = ['is_archived', 'archived_at']
