from rest_framework import generics, permissions
from .models import AuditLog
from .serializers import AuditLogSerializer, AuditLogCreateSerializer


# Audit Log List
class AuditLogListView(generics.ListAPIView):
    queryset = AuditLog.objects.all().order_by('-created_at')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]


# Audit Log Create
class AuditLogCreateView(generics.CreateAPIView):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


# Audit Log Detail
class AuditLogDetailView(generics.RetrieveAPIView):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
# Create your views here.
