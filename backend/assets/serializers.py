from rest_framework import serializers
from .models import Asset, AssetAllocationHistory
from employees.serializers import EmployeeListSerializer


class AssetSerializer(serializers.ModelSerializer):
    assigned_to = EmployeeListSerializer(read_only=True)

    class Meta:
        model = Asset
        fields = [
            'id', 'asset_id', 'asset_type', 'brand', 'model_name', 'serial_number',
            'assigned_to', 'asset_issue_date', 'asset_return_date',
            'status', 'condition', 'warranty_expiry_date',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_asset_id(self, value):
        qs = Asset.objects.filter(asset_id=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This Asset ID already exists!")
        return value

    def validate_serial_number(self, value):
        if not value:
            return value
        qs = Asset.objects.filter(serial_number=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "This Serial Number already exists!")
        return value


class AssetCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = [
            'asset_id', 'asset_type', 'brand', 'model_name', 'serial_number',
            'assigned_to', 'asset_issue_date', 'asset_return_date', 'status',
            'condition', 'warranty_expiry_date',
        ]

    def validate_asset_id(self, value):
        qs = Asset.objects.filter(asset_id=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This Asset ID already exists!")
        return value

    def validate_serial_number(self, value):
        if not value:
            return value
        qs = Asset.objects.filter(serial_number=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "This Serial Number already exists!")
        return value


class AssetArchiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = ['is_archived', 'archived_at']


class AssetReportSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = [
            'asset_id', 'asset_type', 'model_name', 'serial_number',
            'assigned_to_name', 'department', 'status',
            'condition', 'warranty_expiry_date',
        ]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}"
        return None

    def get_department(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.department
        return None


class AssetAllocationHistorySerializer(serializers.ModelSerializer):
    employee = EmployeeListSerializer(read_only=True)
    asset_id = serializers.CharField(source='asset.asset_id', read_only=True)
    asset_type = serializers.CharField(
        source='asset.asset_type', read_only=True)

    class Meta:
        model = AssetAllocationHistory
        fields = [
            'id', 'asset', 'asset_id', 'asset_type', 'employee',
            'assigned_date', 'returned_date', 'assigned_by', 'remarks',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
