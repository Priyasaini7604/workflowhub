from rest_framework.views import APIView
from rest_framework.response import Response
from Documents.models import Document
from onboarding.models import OnboardingTask
from offboarding.models import OffboardingTask
from assets.models import Asset
from permissions import IsAuthenticatedAndActive

OFFBOARDING_ELIGIBLE_STATUSES = ['notice_period', 'offboarding', 'exited']


class ApprovalsCenterView(APIView):
    """
    Aggregates all pending approval items relevant to the requesting user's
    role, so HR/IT/Manager don't have to open each employee's page
    individually to find what needs their action.
    """
    permission_classes = [IsAuthenticatedAndActive]

    def get(self, request):
        role = request.user.role
        items = []

        # --- Pending Documents — only HR and SuperAdmin verify documents ---
        if role in ['hr', 'superadmin']:
            pending_docs = Document.objects.filter(
                verification_status='pending', is_archived=False
            ).select_related('employee')

            for doc in pending_docs:
                items.append({
                    'type': 'document',
                    'id': doc.id,
                    'employee_id': doc.employee.id,
                    'employee_name': f"{doc.employee.first_name} {doc.employee.last_name}",
                    'title': doc.get_document_type_display(),
                    'status': doc.verification_status,
                    'created_at': doc.created_at,
                    'action_path': f"/documents?employee={doc.employee.id}",
                })

        # --- Onboarding Tasks — only tasks assigned to this role ---
        if role in ['hr', 'it', 'manager', 'superadmin']:
            task_filter_role = None if role == 'superadmin' else role
            onboarding_qs = OnboardingTask.objects.filter(
                status__in=['pending', 'in_progress'], is_archived=False
            ).select_related('employee')
            if task_filter_role:
                onboarding_qs = onboarding_qs.filter(
                    assigned_to_role=task_filter_role)

            for task in onboarding_qs:
                items.append({
                    'type': 'onboarding_task',
                    'id': task.id,
                    'employee_id': task.employee.id,
                    'employee_name': f"{task.employee.first_name} {task.employee.last_name}",
                    'title': task.task_name,
                    'status': task.status,
                    'created_at': task.created_at,
                    'action_path': f"/onboarding?employee={task.employee.id}",
                })

        # --- Offboarding Tasks — only tasks assigned to this role, AND only
        # for employees who are actually in an offboarding-eligible status.
        # This guards against stale tasks left over from a bug where
        # offboarding could previously be started for an 'active' employee.
        if role in ['hr', 'it', 'manager', 'superadmin']:
            task_filter_role = None if role == 'superadmin' else role
            offboarding_qs = OffboardingTask.objects.filter(
                status__in=['pending', 'in_progress'],
                is_archived=False,
                employee__current_status__in=OFFBOARDING_ELIGIBLE_STATUSES,
            ).select_related('employee')
            if task_filter_role:
                offboarding_qs = offboarding_qs.filter(
                    assigned_to_role=task_filter_role)

            for task in offboarding_qs:
                items.append({
                    'type': 'offboarding_task',
                    'id': task.id,
                    'employee_id': task.employee.id,
                    'employee_name': f"{task.employee.first_name} {task.employee.last_name}",
                    'title': task.task_name,
                    'status': task.status,
                    'created_at': task.created_at,
                    'action_path': f"/offboarding?employee={task.employee.id}",
                })

        # --- Pending Asset Acknowledgments — IT's specific concern ---
        if role in ['it', 'superadmin']:
            pending_assets = Asset.objects.filter(
                status='pending_acknowledgment', is_archived=False
            ).select_related('assigned_to')

            for asset in pending_assets:
                if asset.assigned_to:
                    items.append({
                        'type': 'asset_acknowledgment',
                        'id': asset.id,
                        'employee_id': asset.assigned_to.id,
                        'employee_name': f"{asset.assigned_to.first_name} {asset.assigned_to.last_name}",
                        'title': f"{asset.brand} {asset.model_name} ({asset.asset_id}) — awaiting acknowledgment",
                        'status': asset.status,
                        'created_at': asset.acknowledgment_requested_at or asset.updated_at,
                        'action_path': f"/assets/{asset.id}",
                    })

        items.sort(key=lambda x: x['created_at'])

        return Response({
            'total_pending': len(items),
            'items': items,
        })
