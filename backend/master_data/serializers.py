from rest_framework import serializers
from .models import AssetCategory


class AssetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetCategory
        fields = [
            'id',
            'name',
            'code',
            'asset_id_prefix',
            'is_active',
            'created_at',
            'created_by']
        read_only_fields = ['id', 'created_at', 'created_by']
