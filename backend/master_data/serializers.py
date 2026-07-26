from rest_framework import serializers
from .models import AssetCategory


class AssetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetCategory
        fields = ['id', 'name', 'code', 'is_active', 'created_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'created_by']