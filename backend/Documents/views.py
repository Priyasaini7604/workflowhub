from rest_framework import generics, permissions
from django.utils import timezone
from audit.utils import create_audit_log
from notifications.utils import notify
from onboarding.models import OnboardingChecklist
from .models import Document
from .serializers import (
    DocumentSerializer,
    DocumentCreateSerializer,
    DocumentArchiveSerializer,
    DocumentVerifySerializer,
)
from permissions import IsHROrSuperAdmin

REQUIRED_ONBOARDING_DOCUMENT_TYPES = [
    'resume', 'offer_letter', 'nda', 'aadhaar', 'pan',
    'passport', 'educational_certificate', 'experience_certificate',
    'policy_acceptance',
]


# Document List
class DocumentListView(generics.ListAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        employee_id = self.kwargs.get('employee_id')

        if user.role in ['hr', 'superadmin']:
            return Document.objects.filter(
                employee=employee_id,
                is_archived=False
            )
        elif user.role == 'employee':
            return Document.objects.filter(
                employee__user=user,
                is_archived=False
            )
        return Document.objects.none()


# Document Upload
class DocumentCreateView(generics.CreateAPIView):
    queryset = Document.objects.all()
    serializer_class = DocumentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        document = serializer.save()
        create_audit_log(
            user=self.request.user,
            action='create',
            model_name='Document',
            object_id=document.id,
            description=f'Document "{
                document.document_type}" uploaded for {
                document.employee}',
            request=self.request
        )

        # --- Sync with OnboardingChecklist ---
        checklist, _ = OnboardingChecklist.objects.get_or_create(
            employee=document.employee
        )
        submitted_types = Document.objects.filter(
            employee=document.employee,
            is_archived=False
        ).values_list('document_type', flat=True)

        if all(t in submitted_types for t in REQUIRED_ONBOARDING_DOCUMENT_TYPES):
            checklist.documents_submitted = True
            checklist.save()


class DocumentDetailView(generics.RetrieveAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role in ['hr', 'superadmin']:
            return Document.objects.filter(is_archived=False)
        elif user.role == 'employee':
            return Document.objects.filter(
                employee__user=user,
                is_archived=False
            )
        return Document.objects.none()


class DocumentVerifyView(generics.UpdateAPIView):
    serializer_class = DocumentVerifySerializer
    permission_classes = [IsHROrSuperAdmin]

    def get_queryset(self):
        return Document.objects.filter(is_archived=False)

    def post(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def perform_update(self, serializer):
        # Accept 'verified' or 'rejected' from the request body. Defaults to
        # 'verified' so any existing frontend call that doesn't send a
        # status keeps behaving exactly as before.
        new_status = self.request.data.get('verification_status', 'verified')
        if new_status not in ('verified', 'rejected'):
            new_status = 'verified'

        document = serializer.save(
            verification_status=new_status,
            verified_by=self.request.user,
            verified_at=timezone.now()
        )
        create_audit_log(
            user=self.request.user,
            action='update',
            model_name='Document',
            object_id=document.id,
            description=(
                f'Document "{document.document_type}" verification '
                f'status changed to {document.verification_status}'
            ),
            request=self.request
        )

        # Let the employee know either way.
        if new_status == 'rejected':
            notify(
                recipient=getattr(document.employee, 'user', None),
                title='Document rejected',
                message=f'Your "{
                    document.document_type}" document was rejected. Please re-upload a corrected copy.',
                notification_type='general',
            )
            return  # rejected docs don't count toward onboarding completion

        notify(
            recipient=getattr(document.employee, 'user', None),
            title='Document verified',
            message=f'Your "{
                document.document_type}" document has been verified.',
            notification_type='general',
        )

        # --- Sync with OnboardingChecklist (only relevant when verified) ---
        checklist, _ = OnboardingChecklist.objects.get_or_create(
            employee=document.employee
        )

        if document.document_type == 'offer_letter':
            checklist.offer_letter_uploaded = True
            checklist.save()

        onboarding_docs = Document.objects.filter(
            employee=document.employee,
            document_type__in=REQUIRED_ONBOARDING_DOCUMENT_TYPES,
            is_archived=False
        )
        if onboarding_docs.exists() and all(
            d.verification_status == 'verified' for d in onboarding_docs
        ):
            checklist.documents_verified = True
            checklist.save()


# Document Archive
class DocumentArchiveView(generics.UpdateAPIView):
    serializer_class = DocumentArchiveSerializer
    permission_classes = [IsHROrSuperAdmin]

    def get_queryset(self):
        return Document.objects.filter(is_archived=False)

    def perform_update(self, serializer):
        document = serializer.save(
            is_archived=True,
            archived_at=timezone.now()
        )
        create_audit_log(
            user=self.request.user,
            action='delete',
            model_name='Document',
            object_id=document.id,
            description=f'Document "{document.document_type}" archived',
            request=self.request
        )
