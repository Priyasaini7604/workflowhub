from django.contrib import admin
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['employee', 'document_type', 'verification_status', 'verified_by', 'created_at']
