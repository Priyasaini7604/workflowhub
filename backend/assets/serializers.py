from rest_framework import serializers
from .models import Asset, AssetAllocationHistory
from employees.serializers import EmployeeListSerializer
from master_data.serializers import AssetCategorySerializer


class AssetSerializer(serializers.ModelSerializer):
    assigned_to = EmployeeListSerializer(read_only=True)
    category_detail = AssetCategorySerializer(
        source='category', read_only=True)

    class Meta:
        model = Asset
        fields = [
            'id',
            'asset_id',
            'category',
            'category_detail',
            'brand',
            'model_name',
            'serial_number',
            'assigned_to',
            'asset_issue_date',
            'asset_return_date',
            'status',
            'condition',
            'warranty_expiry_date',
            'qr_code_image',
            'qr_generated_at',
            'created_at',
            'updated_at',
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
    asset_id = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Asset
        fields = [
            'asset_id', 'category', 'brand', 'model_name', 'serial_number',
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

    def validate(self, data):
        if self.instance is None:
            # Naya asset create ho raha hai — assignment-related
            # checks lagu nahi hote
            return data

        new_assigned_to = data.get('assigned_to', self.instance.assigned_to)
        old_assigned_to = self.instance.assigned_to
        new_status = data.get('status', self.instance.status)

        # --- NAYA: Agar return already pending hai, edit form se
        # is asset ko chhedo mat ---
        if self.instance.status == 'pending_return':
            raise serializers.ValidationError({
                'detail': "A return is already pending confirmation from the employee for this asset."
            })

        # --- Retired/Under Repair asset assign nahi ho sakta ---
        if new_assigned_to is not None and new_status in [
                'retired', 'under_repair', 'lost', 'reserved']:
            raise serializers.ValidationError({
                'assigned_to': (
                    f"Cannot assign an asset that is currently "
                    f"'{self.instance.get_status_display()}'."
                )
            })

        # --- Already assigned asset direct edit se doosre employee ko nahi ---
        if (
            old_assigned_to is not None
            and new_assigned_to is not None
            and new_assigned_to != old_assigned_to
        ):
            raise serializers.ValidationError({
                'assigned_to': (
                    f"This asset is already assigned to {old_assigned_to}. "
                    "Please unassign it first before assigning to someone else."
                )
            })

        # --- Assigned asset ko seedhe retired/under_repair mein nahi
        # (bina unassign kiye) ---
        if (
            self.instance.status == 'assigned'
            and new_status in ['retired', 'under_repair', 'lost']
            and new_assigned_to is not None
        ):
            raise serializers.ValidationError({
                'status': (
                    f"This asset is currently assigned to {old_assigned_to}. "
                    "Please unassign it first before marking it as "
                    f"'{dict(Asset.ASSET_STATUS_CHOICES).get(new_status)}'."
                )
            })

        return data


class AssetInitiateReturnSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = []

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

    def validate(self, data):
        if self.instance is None:
            # Naya asset create ho raha hai — abhi assignment-related
            # checks lagu nahi hote
            return data

        new_assigned_to = data.get('assigned_to', self.instance.assigned_to)
        old_assigned_to = self.instance.assigned_to

        # --- Issue 2 fix: Retired/Under Repair asset assign nahi ho sakta ---
        if new_assigned_to is not None and self.instance.status in [
                'retired', 'under_repair']:
            raise serializers.ValidationError(
                {
                    'assigned_to': f"Cannot assign an asset that is currently '{
                        self.instance.get_status_display()}'."})

        # --- Issue 1 fix: Already assigned asset ko direct edit se
        # doosre employee ko reassign nahi kar sakte ---
        if (
            old_assigned_to is not None
            and new_assigned_to is not None
            and new_assigned_to != old_assigned_to
        ):
            raise serializers.ValidationError({
                'assigned_to': (
                    f"This asset is already assigned to {old_assigned_to}. "
                    "Please unassign it first before assigning to someone else."
                )
            })

        return data


class AssetArchiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = ['is_archived', 'archived_at']


class AssetReportSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    category_name = serializers.CharField(
        source='category.name', read_only=True)

    class Meta:
        model = Asset
        fields = [
            'asset_id', 'category_name', 'model_name', 'serial_number',
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
    asset_category = serializers.CharField(
        source='asset.category.name', read_only=True)

    class Meta:
        model = AssetAllocationHistory
        fields = [
            'id', 'asset', 'asset_id', 'asset_category', 'employee',
            'assigned_date', 'returned_date', 'assigned_by', 'remarks',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

class AssetPublicSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = [
            'asset_id',
            'category_name',
            'brand',
            'model_name',
            'status',
            'condition',
            'assigned_to_name',
        ]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}"
        return None
