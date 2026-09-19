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
        params = self.request.query_params

        search = params.get('search')
        if search:
            queryset = queryset.filter(
                Q(model_name__icontains=search) |
                Q(action__icontains=search) |
                Q(description__icontains=search) |
                Q(user__username__icontains=search)
            )

        # existing: specific record ke logs fetch karne ke liye (timeline
        # jaisi jagah) — model_name + object_id__in dono saath aaye toh ye
        # ek exact-record lookup hai, general filtering se alag priority
        model_name = params.get('model_name')
        object_ids = params.get('object_id__in')
        if model_name and object_ids:
            id_list = [i for i in object_ids.split(',') if i.isdigit()]
            return queryset.filter(
                model_name=model_name, object_id__in=id_list)

        # naya: advanced filtering — action multi-select (comma-separated,
        # single value bhi chalega jaise pehle)
        if params.get('action'):
            action_list = [
                a.strip() for a in params.get('action').split(',') if a.strip()
            ]
            queryset = queryset.filter(action__in=action_list)

        # naya: model_name multi-select (general browsing — object_id__in
        # nahi diya gaya hai is baar)
        if model_name:
            model_list = [
                m.strip() for m in model_name.split(',') if m.strip()
            ]
            queryset = queryset.filter(model_name__in=model_list)

        # naya: owner/user filter — comma-separated usernames
        user_param = params.get('user')
        if user_param:
            user_list = [u.strip() for u in user_param.split(',') if u.strip()]
            queryset = queryset.filter(user__username__in=user_list)

        # naya: date range filter on created_at
        date_from = params.get('date_from')
        date_to = params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

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
