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
    AssetInitiateReturnSerializer
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
        old_asset = self.get_object()
        old_assigned_to = old_asset.assigned_to

        asset = serializer.save()
        new_assigned_to = asset.assigned_to
        today = timezone.now().date()

        # 👇 CASE 1 (NAYA): Fresh assignment via edit form
        # (available → assigned). Force pending_acknowledgment,
        # bypass mat hone do direct 'assigned'.
        if old_assigned_to is None and new_assigned_to is not None:
            asset.status = 'pending_acknowledgment'
            asset.acknowledgment_requested_at = timezone.now()
            asset.save()

            AssetAllocationHistory.objects.create(
                asset=asset,
                employee=new_assigned_to,
                assigned_date=asset.asset_issue_date or today,
                assigned_by=self.request.user,
                acknowledgment_status='pending'
            )

            notify(
                recipient=getattr(new_assigned_to, 'user', None),
                title='New asset assigned',
                message=f'{
                    asset.brand} {
                    asset.model_name} ({
                    asset.asset_id}) has been assigned to you. Please review and acknowledge.',
                notification_type='asset',
            )

            create_audit_log(
                user=self.request.user,
                action='update',
                model_name='Asset',
                object_id=asset.id,
                description=f'Asset {
                    asset.asset_id} assignment initiated for {new_assigned_to} (via edit) — awaiting acknowledgment',
                request=self.request
            )
            return
        # --- CASE 2: Purana logic — unassign / reassign ---
        if old_assigned_to != new_assigned_to:
            if old_assigned_to is not None:
                open_history = AssetAllocationHistory.objects.filter(
                    asset=asset,
                    employee=old_assigned_to,
                    returned_date__isnull=True
                ).order_by('-assigned_date').first()
                if open_history:
                    open_history.returned_date = asset.asset_return_date or today
                    open_history.save()

                notify(
                    recipient=getattr(old_assigned_to, 'user', None),
                    title='Asset returned',
                    message=f'{
                        asset.category} ({
                        asset.asset_id}) has been unassigned from you.',
                    notification_type='asset',
                )

                self._maybe_mark_asset_recovery_complete(old_assigned_to)

            if new_assigned_to is not None:
                AssetAllocationHistory.objects.create(
                    asset=asset,
                    employee=new_assigned_to,
                    assigned_date=asset.asset_issue_date or today,
                    assigned_by=self.request.user
                )

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
# Step 1: HR/IT Admin initiates assignment — asset goes to
# pending_acknowledgment, NOT assigned
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
                message=f'{
                    asset.brand} {
                    asset.model_name} ({
                    asset.asset_id}) has been assigned to you. Please review and acknowledge.',
                notification_type='asset'
            )

        create_audit_log(
            user=self.request.user,
            action='update',
            model_name='Asset',
            object_id=asset.id,
            description=f'Asset {
                asset.asset_id} assignment initiated for {
                asset.assigned_to} — awaiting acknowledgment',
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
            return Response(
                {"error": "This asset is not assigned to you"}, status=403)

        if asset.status != 'pending_acknowledgment':
            return Response(
                {"error": "No pending acknowledgment for this asset"}, status=400)

        action = request.data.get('action')  # 'accept' or 'reject'
        if action not in ['accept', 'reject']:
            return Response(
                {"error": "action must be 'accept' or 'reject'"}, status=400)

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

            audit_desc = f'Asset {
                asset.asset_id} acknowledged (accepted) by {
                asset.assigned_to}'
        else:
            asset.status = 'available'
            rejected_employee = asset.assigned_to
            asset.assigned_to = None
            asset.acknowledgment_requested_at = None
            asset.save()

            history_entry.acknowledgment_status = 'rejected'
            history_entry.acknowledged_at = timezone.now()
            history_entry.save()

            audit_desc = f'Asset {
                asset.asset_id} rejected by {rejected_employee}, reverted to available'

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

# Admin/IT initiates return — asset goes to pending_return, NOT available yet


class AssetInitiateReturnView(generics.UpdateAPIView):
    serializer_class = AssetInitiateReturnSerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        return Asset.objects.filter(is_archived=False, status='assigned')

    def perform_update(self, serializer):
        asset = self.get_object()

        if asset.assigned_to is None:
            raise serializers.ValidationError(
                {"detail": "This asset is not currently assigned to anyone."}
            )

        asset.status = 'pending_return'
        asset.save(update_fields=['status'])

        # Latest open history row pe note kar do ki return initiate ho gaya
        open_history = AssetAllocationHistory.objects.filter(
            asset=asset,
            employee=asset.assigned_to,
            returned_date__isnull=True
        ).order_by('-assigned_date').first()

        notify(
            recipient=getattr(asset.assigned_to, 'user', None),
            title='Asset return requested',
            message=f'Please return {
                asset.brand} {
                asset.model_name} ({
                asset.asset_id}) and confirm once done.',
            notification_type='asset',
        )

        create_audit_log(
            user=self.request.user,
            action='update',
            model_name='Asset',
            object_id=asset.id,
            description=f'Return initiated for asset {
                asset.asset_id} from {
                asset.assigned_to}',
            request=self.request
        )


class AssetConfirmReturnView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            asset = Asset.objects.get(pk=pk, is_archived=False)
        except Asset.DoesNotExist:
            return Response({"error": "Asset not found"}, status=404)

        # Employee sirf apna khud ka asset confirm kar sakta hai
        if asset.assigned_to_id != request.user.employee_profile.id:
            return Response(
                {"error": "This asset is not assigned to you"}, status=403)

        if asset.status != 'pending_return':
            return Response(
                {"error": "No return is pending for this asset"}, status=400)

        returned_employee = asset.assigned_to
        today = timezone.now().date()

        # History close karo
        open_history = AssetAllocationHistory.objects.filter(
            asset=asset,
            employee=returned_employee,
            returned_date__isnull=True
        ).order_by('-assigned_date').first()
        if open_history:
            open_history.returned_date = today
            open_history.save()

        # Asset free karo
        asset.status = 'available'
        asset.assigned_to = None
        asset.acknowledgment_requested_at = None
        asset.acknowledged_at = None
        asset.save()

        # Agar offboarding chal rahi thi, aur ab koi asset nahi bacha, toh tick
        # karo
        self._maybe_mark_asset_recovery_complete(returned_employee)

        create_audit_log(
            user=request.user,
            action='update',
            model_name='Asset',
            object_id=asset.id,
            description=f'Asset {
                asset.asset_id} return confirmed by {returned_employee}',
            request=request
        )

        return Response(AssetSerializer(asset).data)

    def _maybe_mark_asset_recovery_complete(self, employee):
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
                checklist.asset_recovery_status = True
                checklist.save()
