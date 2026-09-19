from django.contrib import admin
from .models import SoftwareAccess


@admin.register(SoftwareAccess)
class SoftwareAccessAdmin(admin.ModelAdmin):
    list_display = (
        'employee',
        'software_name',
        'status',
        'granted_on',
        'revoked_on',
        'is_archived')
    list_filter = ('status', 'is_archived')
    search_fields = (
        'software_name',
        'employee__first_name',
        'employee__last_name')
