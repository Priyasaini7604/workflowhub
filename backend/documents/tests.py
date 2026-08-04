# documents/tests.py

from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from users.models import User
from employees.models import Employee
from onboarding.models import OnboardingChecklist
from .models import Document
from .services import (
    sync_onboarding_documents_submitted,
    sync_onboarding_documents_verified,
    REQUIRED_ONBOARDING_DOCUMENT_TYPES,
)
from .views import DocumentVerifyView

_counter = 0


def make_employee(**overrides):
    global _counter
    _counter += 1

    user = overrides.pop('user', None)
    if user is None:
        user = User.objects.create_user(
            username=f"testuser{_counter}",
            password="testpass123",
            role=overrides.pop('role', 'employee'),
        )

    defaults = {
        'user': user,
        'employee_id': f"EMP{900 + _counter}",
        'first_name': "Test",
        'last_name': f"User{_counter}",
        'designation': "Engineer",
        'department': "Tech",
        'date_of_joining': "2025-01-01",
        'current_status': "joining_pending",
    }
    defaults.update(overrides)
    return Employee.objects.create(**defaults)


def make_document(employee, doc_type, **overrides):
    defaults = {
        'employee': employee,
        'document_type': doc_type,
        'verification_status': 'pending',
    }
    defaults.update(overrides)
    return Document.objects.create(**defaults)


class SyncDocumentsSubmittedTests(TestCase):
    """documents_submitted flips True only when ALL 9 required types
    have been uploaded — partial sets must not trip it."""

    def setUp(self):
        self.employee = make_employee()

    def test_false_when_no_documents(self):
        checklist = sync_onboarding_documents_submitted(self.employee)
        self.assertFalse(checklist.documents_submitted)

    def test_false_when_some_required_types_missing(self):
        for doc_type in REQUIRED_ONBOARDING_DOCUMENT_TYPES[:-1]:  # miss one
            make_document(self.employee, doc_type)

        checklist = sync_onboarding_documents_submitted(self.employee)
        self.assertFalse(checklist.documents_submitted)

    def test_true_when_all_required_types_present(self):
        for doc_type in REQUIRED_ONBOARDING_DOCUMENT_TYPES:
            make_document(self.employee, doc_type)

        checklist = sync_onboarding_documents_submitted(self.employee)
        self.assertTrue(checklist.documents_submitted)

    def test_archived_document_does_not_count_toward_submission(self):
        for doc_type in REQUIRED_ONBOARDING_DOCUMENT_TYPES:
            is_archived = (doc_type == REQUIRED_ONBOARDING_DOCUMENT_TYPES[0])
            make_document(self.employee, doc_type, is_archived=is_archived)

        checklist = sync_onboarding_documents_submitted(self.employee)
        self.assertFalse(checklist.documents_submitted)

    def test_extra_non_required_type_does_not_break_check(self):
        for doc_type in REQUIRED_ONBOARDING_DOCUMENT_TYPES:
            make_document(self.employee, doc_type)
        make_document(self.employee, "other")  # not in required list

        checklist = sync_onboarding_documents_submitted(self.employee)
        self.assertTrue(checklist.documents_submitted)


class SyncDocumentsVerifiedTests(TestCase):
    """documents_verified requires ALL required types to be individually
    verification_status='verified' — offer_letter_uploaded is separate
    and flips as soon as an offer_letter document exists at all."""

    def setUp(self):
        self.employee = make_employee()

    def test_offer_letter_flag_set_regardless_of_verification_status(self):
        doc = make_document(
            self.employee, "offer_letter", verification_status="pending"
        )
        checklist = sync_onboarding_documents_verified(doc)
        self.assertTrue(checklist.offer_letter_uploaded)

    def test_documents_verified_false_when_some_pending(self):
        for doc_type in REQUIRED_ONBOARDING_DOCUMENT_TYPES:
            status = (
                "pending"
                if doc_type == REQUIRED_ONBOARDING_DOCUMENT_TYPES[-1]
                else "verified"
            )
            make_document(self.employee, doc_type, verification_status=status)

        last_doc = Document.objects.get(
            employee=self.employee,
            document_type=REQUIRED_ONBOARDING_DOCUMENT_TYPES[0],
        )
        checklist = sync_onboarding_documents_verified(last_doc)
        self.assertFalse(checklist.documents_verified)

    def test_documents_verified_true_when_all_verified(self):
        docs = []
        for doc_type in REQUIRED_ONBOARDING_DOCUMENT_TYPES:
            docs.append(
                make_document(
                    self.employee, doc_type, verification_status="verified"
                )
            )

        checklist = sync_onboarding_documents_verified(docs[-1])
        self.assertTrue(checklist.documents_verified)

    def test_rejected_document_blocks_documents_verified(self):
        for doc_type in REQUIRED_ONBOARDING_DOCUMENT_TYPES:
            status = (
                "rejected"
                if doc_type == REQUIRED_ONBOARDING_DOCUMENT_TYPES[0]
                else "verified"
            )
            make_document(self.employee, doc_type, verification_status=status)

        last_doc = Document.objects.get(
            employee=self.employee,
            document_type=REQUIRED_ONBOARDING_DOCUMENT_TYPES[-1],
        )
        checklist = sync_onboarding_documents_verified(last_doc)
        self.assertFalse(checklist.documents_verified)


class DocumentVerifyViewTests(TestCase):
    """View-level: invalid status defaults to 'verified'; rejected
    documents must NOT trigger the documents_verified sync."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.employee = make_employee()
        self.hr_user = User.objects.create_user(
            username="hr_doc", password="test123", role="hr"
        )

    def _verify(self, doc, status_value):
        request = self.factory.post(
            f"/api/documents/{doc.id}/verify/",
            {"verification_status": status_value},
        )
        force_authenticate(request, user=self.hr_user)
        view = DocumentVerifyView.as_view()
        return view(request, pk=doc.id)

    @patch("documents.views.notify_document_verification")
    def test_missing_status_key_defaults_to_verified(self, mock_notify):
        doc = make_document(self.employee, "resume")
        request = self.factory.post(f"/api/documents/{doc.id}/verify/", {})
        force_authenticate(request, user=self.hr_user)
        view = DocumentVerifyView.as_view()
        response = view(request, pk=doc.id)

        self.assertEqual(response.status_code, 200)
        doc.refresh_from_db()
        self.assertEqual(doc.verification_status, "verified")

    @patch("documents.views.notify_document_verification")
    def test_rejected_document_does_not_mark_documents_verified(
        self, mock_notify
    ):
        docs = []
        for doc_type in REQUIRED_ONBOARDING_DOCUMENT_TYPES:
            docs.append(make_document(self.employee, doc_type))

        for d in docs[:-1]:
            d.verification_status = "verified"
            d.save()

        response = self._verify(docs[-1], "rejected")
        self.assertEqual(response.status_code, 200)

        # Rejecting returns early before the sync function ever runs, so
        # the checklist row was never even created — that itself is the
        # behavior we're locking in.
        self.assertFalse(
            OnboardingChecklist.objects.filter(employee=self.employee).exists()
        )

    @patch("documents.views.notify_document_verification")
    def test_verified_document_completes_the_set(self, mock_notify):
        docs = []
        for doc_type in REQUIRED_ONBOARDING_DOCUMENT_TYPES:
            docs.append(make_document(self.employee, doc_type))

        for d in docs[:-1]:
            d.verification_status = "verified"
            d.save()

        response = self._verify(docs[-1], "verified")
        self.assertEqual(response.status_code, 200)

        checklist = OnboardingChecklist.objects.get(employee=self.employee)
        self.assertTrue(checklist.documents_verified)

    @patch("documents.views.notify_document_verification")
    def test_sets_verified_by_and_verified_at(self, mock_notify):
        doc = make_document(self.employee, "resume")
        self._verify(doc, "verified")

        doc.refresh_from_db()
        self.assertEqual(doc.verified_by, self.hr_user)
        self.assertIsNotNone(doc.verified_at)
