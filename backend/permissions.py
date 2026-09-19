from rest_framework import permissions


def _has_role(request, *roles):
    """Safely check the user's role — returns False (never crashes)
    if the user isn't authenticated yet (AnonymousUser has no .role)."""
    return (
        request.user
        and request.user.is_authenticated
        and request.user.role in roles
    )


class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, 'superadmin')


class IsHR(permissions.BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, 'hr')


class IsITAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, 'it')


class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, 'manager')


class IsEmployee(permissions.BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, 'employee')


class IsHROrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, 'hr', 'superadmin')


class IsITAdminOrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, 'it', 'superadmin')


class IsManagerOrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, 'manager', 'superadmin')


class IsHROrManagerOrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, 'hr', 'manager', 'superadmin')


class IsAuthenticatedAndActive(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        employee_profile = getattr(request.user, 'employee_profile', None)
        if employee_profile is not None and employee_profile.is_archived:
            return False

        return True
