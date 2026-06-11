from rest_framework import generics, permissions
from .models import AuditLog
from .serializers import AuditLogSerializer, AuditLogCreateSerializer
from permissions import IsHROrSuperAdmin

# Audit Log List
class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsHROrSuperAdmin]

    def get_queryset(self):
        return AuditLog.objects.all().order_by('-created_at')


# Audit Log Create
class AuditLogCreateView(generics.CreateAPIView):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogCreateSerializer
    permission_classes = [IsHROrSuperAdmin]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# Audit Log Detail
class AuditLogDetailView(generics.RetrieveAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsHROrSuperAdmin]

    def get_queryset(self):
        return AuditLog.objects.all()
