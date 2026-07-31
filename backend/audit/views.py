from rest_framework import generics
from .models import AuditLog
from .serializers import AuditLogSerializer
from permissions import IsSuperAdmin

# Audit Log List


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        return AuditLog.objects.all().order_by('-created_at')


# Audit Log Create


# Audit Log Detail
class AuditLogDetailView(generics.RetrieveAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        return AuditLog.objects.all()
