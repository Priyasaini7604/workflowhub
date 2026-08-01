from notifications.utils import notify
from onboarding.models import OnboardingChecklist
from .models import Document

REQUIRED_ONBOARDING_DOCUMENT_TYPES = [
    'resume', 'offer_letter', 'nda', 'aadhaar', 'pan',
    'passport', 'educational_certificate',
    'experience_certificate', 'policy_acceptance',
]


def sync_onboarding_documents_submitted(employee):
    """Saare required docs submit ho chuke hain kya, checklist update karo."""
    checklist, _ = OnboardingChecklist.objects.get_or_create(
        employee=employee
    )
    submitted_types = Document.objects.filter(
        employee=employee, is_archived=False
    ).values_list('document_type', flat=True)

    if all(t in submitted_types for t in REQUIRED_ONBOARDING_DOCUMENT_TYPES):
        checklist.documents_submitted = True
        checklist.save()
    return checklist


def sync_onboarding_documents_verified(document):
    """Verify hone ke baad checklist + offer_letter flag update karo."""
    checklist, _ = OnboardingChecklist.objects.get_or_create(
        employee=document.employee
    )

    if document.document_type == 'offer_letter':
        checklist.offer_letter_uploaded = True
        checklist.save()

    verified_types = set(
        Document.objects.filter(
            employee=document.employee,
            document_type__in=REQUIRED_ONBOARDING_DOCUMENT_TYPES,
            is_archived=False,
            verification_status='verified'
        ).values_list('document_type', flat=True)
    )
    required = set(REQUIRED_ONBOARDING_DOCUMENT_TYPES)
    if required.issubset(verified_types):
        checklist.documents_verified = True
        checklist.save()
    return checklist


def notify_document_verification(document, new_status):
    """Employee ko verify/reject ka notification bhejo."""
    if new_status == 'rejected':
        notify(
            recipient=getattr(document.employee, 'user', None),
            title='Document rejected',
            message=(
                f'Your "{document.document_type}" document was '
                'rejected. Please re-upload a corrected copy.'
            ),
            notification_type='general',
        )
    else:
        notify(
            recipient=getattr(document.employee, 'user', None),
            title='Document verified',
            message=(
                f'Your "{document.document_type}" document has '
                'been verified.'
            ),
            notification_type='general',
        )
