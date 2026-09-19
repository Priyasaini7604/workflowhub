"""
employees/views_bulk_import.py

Two endpoints:
  POST /api/employees/bulk-import/preview/   -> validate CSV, return per-row results
  POST /api/employees/bulk-import/commit/    -> actually create/update records

Add these to employees/urls.py:
    path("bulk-import/preview/", EmployeeBulkImportPreviewView.as_view()),
    path("bulk-import/commit/", EmployeeBulkImportCommitView.as_view()),
"""

from dataclasses import asdict

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser

from .models import Employee
from .serializers import CandidateCreateSerializer
# reuse existing permission class
from permissions import IsHROrSuperAdmin
from bulk_import.services import CSVBulkImporter
from audit.utils import create_audit_log            # reuse existing audit helper

# Bulk-imported rows land in the Candidate stage — same as a manually
# entered candidate. No `user` account or `employee_id` is created at this
# point; those get generated later when the record moves to
# `joining_pending`, exactly as the normal single-entry flow already works.
EMPLOYEE_REQUIRED_COLUMNS = [
    "first_name", "last_name", "personal_email", "mobile_number",
    "designation", "department",
]

_importer = CSVBulkImporter(
    entity_key="employee",
    model=Employee,
    serializer_class=CandidateCreateSerializer,
    duplicate_field="personal_email",
    required_columns=EMPLOYEE_REQUIRED_COLUMNS,
)


class EmployeeBulkImportPreviewView(APIView):
    permission_classes = [IsHROrSuperAdmin]
    parser_classes = [MultiPartParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"detail": "No file uploaded."},
                            status=status.HTTP_400_BAD_REQUEST)

        if not uploaded_file.name.lower().endswith(".csv"):
            return Response({"detail": "Only .csv files are supported."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            preview = _importer.preview(uploaded_file)
        except ValueError as e:
            return Response({"detail": str(e)},
                            status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "session_id": preview.session_id,
            "total_rows": preview.total_rows,
            "valid_count": preview.valid_count,
            "error_count": preview.error_count,
            "duplicate_count": preview.duplicate_count,
            "rows": [asdict(r) for r in preview.rows],
        })


class EmployeeBulkImportCommitView(APIView):
    permission_classes = [IsHROrSuperAdmin]

    def post(self, request):
        session_id = request.data.get("session_id")
        # row_decisions comes in as {"3": "update", "7": "skip"} from the
        # frontend (JSON keys are strings) — normalize to int keys.
        raw_decisions = request.data.get("row_decisions", {})
        row_decisions = {int(k): v for k, v in raw_decisions.items()}

        if not session_id:
            return Response({"detail": "session_id is required."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            created, updated, skipped, failed_rows = _importer.commit(
                session_id, row_decisions, created_by=request.user
            )
        except ValueError as e:
            return Response({"detail": str(e)},
                            status=status.HTTP_400_BAD_REQUEST)

        create_audit_log(
            user=request.user,
            action="bulk_import",
            model_name="Employee",
            object_id=0,
            description=f"Bulk import: {created} created, {updated} updated, "
            f"{skipped} skipped, {len(failed_rows)} failed.",
            request=request,
        )

        return Response({
            "created": created,
            "updated": updated,
            "skipped": skipped,
            "failed_rows": failed_rows,
        })
