from rest_framework import generics, permissions
from .models import AuditLog
from .serializers import AuditLogSerializer
from permissions import IsSuperAdmin
from django.db.models import Q


# Audit Log List


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        queryset = AuditLog.objects.all()

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(model_name__icontains=search) |
                Q(action__icontains=search) |
                Q(description__icontains=search) |
                Q(user__username__icontains=search)
            )

        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)

        # naya: specific record ke logs fetch karne ke liye (timeline jaisi
        # jagah)
        model_name = self.request.query_params.get('model_name')
        object_ids = self.request.query_params.get('object_id__in')
        if model_name and object_ids:
            id_list = [i for i in object_ids.split(',') if i.isdigit()]
            queryset = queryset.filter(
                model_name=model_name, object_id__in=id_list)

        return queryset
# Audit Log Create


# Audit Log Detail
class AuditLogDetailView(generics.RetrieveAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        return AuditLog.objects.all()


class RecordAuditLogView(generics.ListAPIView):
    """Scoped audit-log lookup for specific records (e.g. Onboarding timeline).
    Only SuperAdmin and HR can use this — and only ever get logs for the exact
    model_name + object_id__in they ask for, never a general/unfiltered list."""
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role not in ['hr', 'superadmin']:
            return AuditLog.objects.none()

        model_name = self.request.query_params.get('model_name')
        object_ids = self.request.query_params.get('object_id__in')
        if not (model_name and object_ids):
            return AuditLog.objects.none()  # no filter = no data, no general browsing here

        id_list = [i for i in object_ids.split(',') if i.isdigit()]
        return AuditLog.objects.filter(
            model_name=model_name, object_id__in=id_list)
