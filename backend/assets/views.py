from rest_framework import generics, permissions
from django.utils import timezone
from .models import Asset, AssetAllocationHistory
from audit.utils import create_audit_log
from .serializers import (
    AssetSerializer,
    AssetCreateSerializer,
    AssetReportSerializer,
    AssetArchiveSerializer,
    AssetAllocationHistorySerializer,
)
from permissions import IsITAdminOrSuperAdmin

# Asset List
class AssetListView(generics.ListAPIView):
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role in ['it', 'superadmin']:
            return Asset.objects.filter(is_archived=False)

        elif user.role == 'manager':
            return Asset.objects.filter(
                assigned_to__reporting_manager__user=user,
                is_archived=False
            )
        elif user.role == 'employee':
            return Asset.objects.filter(
                assigned_to__user=user,
                is_archived=False
            )
        return Asset.objects.none()


# Asset Create
class AssetCreateView(generics.CreateAPIView):
    queryset = Asset.objects.all()
    serializer_class = AssetCreateSerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def perform_create(self, serializer):
        asset = serializer.save()
        create_audit_log(
            user=self.request.user,
            action='create',
            model_name='Asset',
            object_id=asset.id,
            description=f'Asset {asset.asset_id} created',
            request=self.request
        )


# Asset Detail
class AssetDetailView(generics.RetrieveAPIView):
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role in ['it', 'superadmin']:
            return Asset.objects.filter(is_archived=False)

        elif user.role == 'manager':
            return Asset.objects.filter(
                assigned_to__reporting_manager__user=user,
                is_archived=False
            )

        elif user.role == 'employee':
            return Asset.objects.filter(
                assigned_to__user=user,
                is_archived=False
            )

        return Asset.objects.none()

# Asset Update


class AssetUpdateView(generics.UpdateAPIView):
    serializer_class = AssetCreateSerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        return Asset.objects.filter(is_archived=False)

    def perform_update(self, serializer):
        asset = serializer.save()
        create_audit_log(
            user=self.request.user,
            action='update',
            model_name='Asset',
            object_id=asset.id,
            description=f'Asset {asset.asset_id} updated',
            request=self.request
        )


# Asset Archive
class AssetArchiveView(generics.UpdateAPIView):
    serializer_class = AssetArchiveSerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        return Asset.objects.filter(is_archived=False)

    def perform_update(self, serializer):
        asset = serializer.save(
            is_archived=True,
            archived_at=timezone.now()
        )
        create_audit_log(
            user=self.request.user,
            action='delete',
            model_name='Asset',
            object_id=asset.id,
            description=f'Asset {asset.asset_id} archived',
            request=self.request
        )


# Asset Assign to the employees
class AssetAssignView(generics.UpdateAPIView):
    serializer_class = AssetCreateSerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        return Asset.objects.filter(is_archived=False)

    def perform_update(self, serializer):
        asset = serializer.save(status='assigned')

        if asset.assigned_to:
            AssetAllocationHistory.objects.create(
                asset=asset,
                employee=asset.assigned_to,
                assigned_date=asset.asset_issue_date or timezone.now().date(),
                assigned_by=self.request.user
            )
        create_audit_log(
            user=self.request.user,
            action='update',
            model_name='Asset',
            object_id=asset.id,
            description=f'Asset {asset.asset_id} assigned to {asset.assigned_to}',
            request=self.request
        )


class AssetStatusReportView(generics.ListAPIView):
    serializer_class = AssetReportSerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        return Asset.objects.filter(is_archived=False)

# Asset Allocation History — Sirf IT Admin/SuperAdmin


class AssetAllocationHistoryView(generics.ListAPIView):
    serializer_class = AssetAllocationHistorySerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        asset_id = self.kwargs.get('asset_id')
        return AssetAllocationHistory.objects.filter(
            asset=asset_id
        ).order_by('-assigned_date')
