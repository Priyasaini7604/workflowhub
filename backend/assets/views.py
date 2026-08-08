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
    AssetInitiateReturnSerializer,
    AssetTransferSerializer
)
from permissions import IsITAdminOrSuperAdmin
from notifications.models import Notification
import csv
from django.http import HttpResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from .services import generate_qr_for_asset
from rest_framework.permissions import AllowAny
from .serializers import AssetPublicSerializer

# Asset List


class AssetListView(generics.ListAPIView):
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role in ['it', 'superadmin']:
            queryset = Asset.objects.filter(is_archived=False)
        elif user.role == 'manager':
            queryset = Asset.objects.filter(
                assigned_to__reporting_manager__user=user,
                is_archived=False
            )
        elif user.role == 'employee':
            queryset = Asset.objects.filter(
                assigned_to__user=user,
                is_archived=False
            )
        else:
            return Asset.objects.none()

        # N+1 fix: assigned_to -> Employee, assigned_to__user -> User,
        # category -> AssetCategory are all serialized per-row by
        # AssetSerializer
        queryset = queryset.select_related('assigned_to__user', 'category')

        # naya: optional employee filter (used by OnboardingPage)
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(assigned_to_id=employee_id)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(asset_id__icontains=search) |
                Q(brand__icontains=search) |
                Q(model_name__icontains=search) |
                Q(serial_number__icontains=search)
            )
        return queryset


# Asset Create
class AssetCreateView(generics.CreateAPIView):
    queryset = Asset.objects.all()
    serializer_class = AssetCreateSerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def generate_asset_id(self, category):
        prefix = f"MPRW{category.asset_id_prefix}"
        existing_ids = Asset.objects.filter(
            asset_id__startswith=prefix
        ).values_list('asset_id', flat=True)

        num = 1
        while True:
            new_id = f"{prefix}{num:03d}"
            if new_id not in existing_ids:
                return new_id
            num += 1

    def perform_create(self, serializer):
        category = serializer.validated_data['category']
        asset_id = self.generate_asset_id(category)
        asset = serializer.save(asset_id=asset_id)
        generate_qr_for_asset(asset)
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

        # N+1 fix: single object per request, but AssetSerializer still
        # triggers 2-3 extra queries (assigned_to, assigned_to.user, category)
        # without this — cheap to fix, kept consistent with AssetListView
        base = Asset.objects.select_related('assigned_to__user', 'category')

        if user.role in ['it', 'superadmin']:
            return base.filter(is_archived=False)

        elif user.role == 'manager':
            return base.filter(
                assigned_to__reporting_manager__user=user,
                is_archived=False
            )

        elif user.role == 'employee':
            return base.filter(
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
        old_asset = self.get_object()
        old_assigned_to = old_asset.assigned_to

        asset = serializer.save()
        new_assigned_to = asset.assigned_to
        today = timezone.now().date()

        # CASE 1: Fresh assignment via edit form (available → assigned)
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
                recipient=getattr(
                    new_assigned_to,
                    'user',
                    None),
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
                request=self.request)
            return

        if old_assigned_to is not None and new_assigned_to is None:

            asset.assigned_to = old_assigned_to
            asset.status = 'pending_return'
            asset.save()

            notify(
                recipient=getattr(old_assigned_to, 'user', None),
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
                    asset.asset_id} from {old_assigned_to} (via edit) — awaiting confirmation',
                request=self.request)
            return

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
                notification_type='asset')

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
        # N+1 fix: AssetReportSerializer serializes assigned_to and category
        # per row — same fix as AssetListView
        return Asset.objects.filter(
            is_archived=False
        ).select_related('assigned_to__user', 'category')

# Asset Allocation History — Sirf IT Admin/SuperAdmin


class AssetAllocationHistoryView(generics.ListAPIView):
    serializer_class = AssetAllocationHistorySerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        asset_id = self.kwargs.get('asset_id')
        # N+1 fix: check AssetAllocationHistorySerializer — if it nests
        # employee/assigned_by/asset details, select_related them here.
        # Adjust the field list below to match what the serializer actually
        # exposes (over-fetching unused relations wastes the JOIN).
        return AssetAllocationHistory.objects.filter(
            asset=asset_id).select_related(
            'employee__user',
            'assigned_by').order_by('-assigned_date')

# Admin/IT initiates return — asset goes to pending_return, NOT available yet

# Asset Transfer & Reason Log — reallocate an already-assigned asset to a
# different employee, capturing why. Reuses the existing
# pending_acknowledgment / AssetAcknowledgeView flow so the new holder
# still has to accept it, same as a fresh assignment.


class AssetTransferView(APIView):
    permission_classes = [IsITAdminOrSuperAdmin]

    def post(self, request, pk):
        try:
            asset = Asset.objects.get(pk=pk, is_archived=False)
        except Asset.DoesNotExist:
            return Response({"error": "Asset not found"}, status=404)

        serializer = AssetTransferSerializer(
            data=request.data, context={'asset': asset}
        )
        serializer.is_valid(raise_exception=True)

        new_employee = serializer.validated_data['new_employee']
        transfer_reason = serializer.validated_data['transfer_reason']
        remarks = serializer.validated_data['remarks']

        old_employee = asset.assigned_to
        today = timezone.now().date()

        # Close the outgoing employee's open allocation record
        open_history = AssetAllocationHistory.objects.filter(
            asset=asset,
            employee=old_employee,
            returned_date__isnull=True
        ).order_by('-assigned_date').first()
        if open_history:
            open_history.returned_date = today
            open_history.save()

        # Move the asset into pending_acknowledgment for the new employee —
        # same acceptance step a fresh assignment goes through
        asset.assigned_to = new_employee
        asset.status = 'pending_acknowledgment'
        asset.acknowledgment_requested_at = timezone.now()
        asset.acknowledged_at = None
        asset.save()

        AssetAllocationHistory.objects.create(
            asset=asset,
            employee=new_employee,
            assigned_date=today,
            assigned_by=request.user,
            acknowledgment_status='pending',
            transfer_reason=transfer_reason,
            remarks=remarks,
        )

        notify(
            recipient=getattr(old_employee, 'user', None),
            title='Asset transferred',
            message=f'{asset.category} ({asset.asset_id}) has been '
            f'transferred to {new_employee}.',
            notification_type='asset',
        )
        notify(
            recipient=getattr(new_employee, 'user', None),
            title='Asset transferred to you',
            message=f'{asset.category} ({asset.asset_id}) has been '
            f'transferred to you from {old_employee}. Please '
            'review and acknowledge.',
            notification_type='asset',
        )

        create_audit_log(
            user=request.user,
            action='update',
            model_name='Asset',
            object_id=asset.id,
            description=(
                f'Asset {asset.asset_id} transferred from {old_employee} '
                f'to {new_employee} — reason: '
                f'{dict(AssetAllocationHistory.TRANSFER_REASON_CHOICES).get(transfer_reason)}'
                + (f'. Note: {remarks}' if remarks else '')
            ),
            request=request,
        )

        return Response(AssetSerializer(asset).data)


class AssetInitiateReturnView(generics.UpdateAPIView):
    serializer_class = AssetInitiateReturnSerializer
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        return Asset.objects.filter(is_archived=False, status='assigned')

    def perform_update(self, serializer):
        asset = self.get_object()

        if asset.assigned_to is None:
            raise ValidationError(
                {"detail": "This asset is not currently assigned to anyone."}
            )

        asset.status = 'pending_return'
        asset.save(update_fields=['status'])

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


class AssetReportExportCSVView(generics.GenericAPIView):
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        # N+1 fix: this view loops over the full queryset manually (no
        # pagination), accessing asset.assigned_to and asset.category per
        # row — this was the biggest N+1 in the file since it's unbounded
        # by page size. Fixes to just assigned_to (not assigned_to__user)
        # since only Employee's own fields (first_name, last_name,
        # department) are read here, not the linked User.
        return Asset.objects.filter(
            is_archived=False
        ).select_related('assigned_to', 'category')

    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="asset_report.csv"'

        writer = csv.writer(response)

        # Header row
        writer.writerow([
            'Asset ID', 'Category', 'Model Name', 'Serial Number',
            'Assigned To', 'Department', 'Status',
            'Condition', 'Warranty Expiry Date',
        ])

        # Data rows — same logic jo serializer mein hai
        for asset in queryset:
            assigned_to_name = (
                f"{asset.assigned_to.first_name} {asset.assigned_to.last_name}"
                if asset.assigned_to
                else ""
            )

            department = asset.assigned_to.department if asset.assigned_to else ""

            writer.writerow([
                asset.asset_id,
                asset.category.name if asset.category else "",
                asset.model_name,
                asset.serial_number,
                assigned_to_name,
                department,
                asset.status,
                asset.condition,
                asset.warranty_expiry_date or "",
            ])

        return response


class AssetReportExportPDFView(generics.GenericAPIView):
    permission_classes = [IsITAdminOrSuperAdmin]

    def get_queryset(self):
        # Same N+1 fix as AssetReportExportCSVView above
        return Asset.objects.filter(
            is_archived=False
        ).select_related('assigned_to', 'category')

    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="asset_report.pdf"'

        doc = SimpleDocTemplate(
            response,
            pagesize=landscape(A4),
            topMargin=15 * mm,
            bottomMargin=15 * mm,
        )

        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("Asset Status Report", styles['Title']))
        elements.append(Spacer(1, 10))

        data = [['Asset ID',
                 'Category',
                 'Model Name',
                 'Serial Number',
                 'Assigned To',
                 'Department',
                 'Status',
                 'Condition',
                 'Warranty Expiry',
                 ]]

        for asset in queryset:
            assigned_to_name = (
                f"{asset.assigned_to.first_name} {asset.assigned_to.last_name}"
                if asset.assigned_to
                else "-"
            )
            department = asset.assigned_to.department if asset.assigned_to else "-"

            data.append([
                asset.asset_id,
                asset.category.name if asset.category else "-",
                asset.model_name or "-",
                asset.serial_number or "-",
                assigned_to_name,
                department,
                asset.status,
                asset.condition,
                str(asset.warranty_expiry_date) if asset.warranty_expiry_date else "-",
            ])

        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 7),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1),
             [colors.white, colors.HexColor('#f1f5f9')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))

        elements.append(table)
        doc.build(elements)

        return response


class AssetPublicDetailView(generics.RetrieveAPIView):
    serializer_class = AssetPublicSerializer
    permission_classes = [AllowAny]
    lookup_field = 'asset_id'

    def get_queryset(self):
        return Asset.objects.filter(is_archived=False)
