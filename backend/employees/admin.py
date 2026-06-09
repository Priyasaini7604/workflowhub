from django.contrib import admin
from .models import Employee


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'get_username', 'department', 'designation', 'current_status']

    def get_username(self, obj):
        return obj.user.username
    get_username.short_description = 'Username'
