from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'superadmin'


class IsHR(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'hr'


class IsITAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'it'


class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'manager'


class IsEmployee(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'employee'


class IsHROrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['hr', 'superadmin']


class IsITAdminOrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['it', 'superadmin']


class IsManagerOrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['manager', 'superadmin']


class IsHROrManagerOrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['hr', 'manager', 'superadmin']


class IsAuthenticatedAndActive(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            not getattr(request.user, 'is_archived', False)
        )
