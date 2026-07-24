from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from .models import SoftwareAccess
from .serializers import (
    SoftwareAccessSerializer,
    SoftwareAccessCreateSerializer,
    SoftwareAccessRevokeSerializer,
)
from audit.utils import create_audit_log
from permissions import IsAuthenticatedAndActive


class SoftwareAccessListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedAndActive]
    queryset = SoftwareAccess.objects.filter(
        is_archived=False).order_by('-granted_on')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SoftwareAccessCreateSerializer
        return SoftwareAccessSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        employee_id = self.request.query_params.get('employee')
        status_param = self.request.query_params.get('status')
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        create_audit_log(
            user=self.request.user,
            action='ACCESS_GRANTED',
            target=f"{instance.software_name} → {instance.employee}",
            details=f"Access level: {instance.access_level}"
        )


class SoftwareAccessDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticatedAndActive]
    queryset = SoftwareAccess.objects.filter(is_archived=False)
    serializer_class = SoftwareAccessSerializer


class SoftwareAccessRevokeView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticatedAndActive]
    queryset = SoftwareAccess.objects.filter(is_archived=False)
    serializer_class = SoftwareAccessRevokeSerializer

    def perform_update(self, serializer):
        instance = serializer.save(
            status='revoked',
            revoked_on=timezone.now(),
            revoked_by=self.request.user
        )
        create_audit_log(
            user=self.request.user,
            action='ACCESS_REVOKED',
            target=f"{instance.software_name} → {instance.employee}",
            details=f"Revoked by {self.request.user}"
        )


class EmployeePendingAccessView(generics.ListAPIView):
    """For the offboarding checklist — all access currently active for a given employee"""
    permission_classes = [IsAuthenticatedAndActive]
    serializer_class = SoftwareAccessSerializer

    def get_queryset(self):
        employee_id = self.kwargs.get('employee_id')
        return SoftwareAccess.objects.filter(
            employee_id=employee_id, status='active', is_archived=False
        )
