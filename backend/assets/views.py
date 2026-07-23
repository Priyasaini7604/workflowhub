from rest_framework import generics, permissions
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Asset, AssetAllocationHistory
from audit.utils import create_audit_log
from notifications.utils import notify
from .serializers import (
    AssetSerializer,
    AssetCreateSerializer,
    AssetReportSerializer,
    AssetArchiveSerializer,
    AssetAllocationHistorySerializer,
)
from permissions import IsITAdminOrSuperAdmin
from notifications.models import Notification

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

    def generate_asset_id(self):
        # Sab existing asset IDs dekho
        existing_ids = Asset.objects.values_list('asset_id', flat=True)
        num = 1
        while True:
            new_id = f"AST{num:03d}"
            if new_id not in existing_ids:
                return new_id
            num += 1

    def perform_create(self, serializer):
        asset_id = self.generate_asset_id()
        asset = serializer.save(asset_id=asset_id)
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
        # Capture assignment state BEFORE save overwrites it in the DB.
        # self.get_object() re-queries the DB — since serializer.save()
        # hasn't run yet, this still reflects the pre-update row.
        old_asset = self.get_object()
        old_assigned_to = old_asset.assigned_to

        asset = serializer.save()
        new_assigned_to = asset.assigned_to
        today = timezone.now().date()

        if old_assigned_to != new_assigned_to:
            # Was assigned to someone before, and that's changed (returned,
            # or reassigned to someone else) — close their open history row.
            if old_assigned_to is not None:
                open_history = AssetAllocationHistory.objects.filter(
                    asset=asset,
                    employee=old_assigned_to,
                    returned_date__isnull=True
                ).order_by('-assigned_date').first()
                if open_history:
                    open_history.returned_date = asset.asset_return_date or today
                    open_history.save()

                # Let the previous holder know their asset was taken back.
                notify(
                    recipient=getattr(old_assigned_to, 'user', None),
                    title='Asset returned',
                    message=f'{
                        asset.asset_type} ({
                        asset.asset_id}) has been unassigned from you.',
                    notification_type='asset',
                )

                # If this employee no longer holds ANY assets, and they have
                # an offboarding checklist in progress, auto-tick Asset
                # Recovery.
                self._maybe_mark_asset_recovery_complete(old_assigned_to)

            # Now assigned to someone new (fresh assignment or reassignment)
            # — open a new history row for them.
            if new_assigned_to is not None:
                AssetAllocationHistory.objects.create(
                    asset=asset,
                    employee=new_assigned_to,
                    assigned_date=asset.asset_issue_date or today,
                    assigned_by=self.request.user
                )

                # Let the new holder know they've been assigned this asset.
                notify(
                    recipient=getattr(new_assigned_to, 'user', None),
                    title='New asset assigned',
                    message=f'{
                        asset.brand} {
                        asset.model_name} ({
                        asset.asset_id}) has been assigned to you.',
                    notification_type='asset',
                )

        create_audit_log(
            user=self.request.user,
            action='update',
            model_name='Asset',
            object_id=asset.id,
            description=f'Asset {asset.asset_id} updated',
            request=self.request
        )

    def _maybe_mark_asset_recovery_complete(self, employee):
        # Local import avoids a circular import between the assets and
        # offboarding apps at module load time.
        from offboarding.models import OffboardingChecklist

        still_holding_assets = Asset.objects.filter(
            assigned_to=employee,
            is_archived=False
        ).exists()

        if not still_holding_assets:
            checklist = OffboardingChecklist.objects.filter(
                employee=employee,
                asset_recovery_status=False
            ).first()
            if checklist:
                # Use .save() (not queryset .update()) so the model's
                # overridden save() recalculates
                # offboarding_completion_percentage correctly.
                checklist.asset_recovery_status = True
                checklist.save()


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
# Step 1: HR/IT Admin initiates assignment — asset goes to pending_acknowledgment, NOT assigned
class AssetAssignView(generics.UpdateAPIView):
    serializer_class = AssetCreateSerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        return Asset.objects.filter(is_archived=False)

    def perform_update(self, serializer):
        asset = serializer.save(
            status='pending_acknowledgment',
            acknowledgment_requested_at=timezone.now()
        )

        if asset.assigned_to:
            AssetAllocationHistory.objects.create(
                asset=asset,
                employee=asset.assigned_to,
                assigned_date=asset.asset_issue_date or timezone.now().date(),
                assigned_by=self.request.user,
                acknowledgment_status='pending'
            )

            # Notify the employee
            Notification.objects.create(
                recipient=asset.assigned_to.user,
                title='New asset assigned',
                message=f'{asset.brand} {asset.model_name} ({asset.asset_id}) has been assigned to you. Please review and acknowledge.',
                notification_type='asset'
            )

        create_audit_log(
            user=self.request.user,
            action='update',
            model_name='Asset',
            object_id=asset.id,
            description=f'Asset {asset.asset_id} assignment initiated for {asset.assigned_to} — awaiting acknowledgment',
            request=self.request
        )

# Step 2: Employee accepts or rejects — ONLY here status becomes 'assigned'
class AssetAcknowledgeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            asset = Asset.objects.get(pk=pk, is_archived=False)
        except Asset.DoesNotExist:
            return Response({"error": "Asset not found"}, status=404)

        # Employee can only acknowledge their own pending asset
        if asset.assigned_to_id != request.user.employee_profile.id:
            return Response({"error": "This asset is not assigned to you"}, status=403)

        if asset.status != 'pending_acknowledgment':
            return Response({"error": "No pending acknowledgment for this asset"}, status=400)

        action = request.data.get('action')  # 'accept' or 'reject'
        if action not in ['accept', 'reject']:
            return Response({"error": "action must be 'accept' or 'reject'"}, status=400)

        history_entry = asset.allocation_history.filter(
            employee=asset.assigned_to, acknowledgment_status='pending'
        ).latest('created_at')

        if action == 'accept':
            asset.status = 'assigned'
            asset.acknowledged_at = timezone.now()
            asset.save()

            history_entry.acknowledgment_status = 'acknowledged'
            history_entry.acknowledged_at = timezone.now()
            history_entry.save()

            audit_desc = f'Asset {asset.asset_id} acknowledged (accepted) by {asset.assigned_to}'
        else:
            asset.status = 'available'
            rejected_employee = asset.assigned_to
            asset.assigned_to = None
            asset.acknowledgment_requested_at = None
            asset.save()

            history_entry.acknowledgment_status = 'rejected'
            history_entry.acknowledged_at = timezone.now()
            history_entry.save()

            audit_desc = f'Asset {asset.asset_id} rejected by {rejected_employee}, reverted to available'

        create_audit_log(
            user=request.user,
            action='update',
            model_name='Asset',
            object_id=asset.id,
            description=audit_desc,
            request=request
        )

        return Response(AssetSerializer(asset).data)

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
