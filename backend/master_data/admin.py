from django.contrib import admin
from .models import AssetCategory


@admin.register(AssetCategory)
class AssetCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active', 'is_archived', 'created_at')
    list_filter = ('is_active', 'is_archived')
    search_fields = ('name', 'code')
