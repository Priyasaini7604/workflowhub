"""
assets/views_bulk_import.py

Mirrors employees/views_bulk_import.py exactly, just pointed at Asset.
Add to assets/urls.py:
    path("bulk-import/preview/", AssetBulkImportPreviewView.as_view()),
    path("bulk-import/commit/", AssetBulkImportCommitView.as_view()),
"""

from dataclasses import asdict

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser

from .models import Asset
from .serializers import AssetCreateSerializer
# reuse existing permission class
from permissions import IsITAdminOrSuperAdmin
from bulk_import.services import CSVBulkImporter
from audit.utils import create_audit_log

ASSET_REQUIRED_COLUMNS = [
    "asset_id", "category", "brand", "model_name", "serial_number",
    "status", "condition",
]

_importer = CSVBulkImporter(
    entity_key="asset",
    model=Asset,
    serializer_class=AssetCreateSerializer,
    duplicate_field="serial_number",
    required_columns=ASSET_REQUIRED_COLUMNS,
)


class AssetBulkImportPreviewView(APIView):
    permission_classes = [IsITAdminOrSuperAdmin]
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


class AssetBulkImportCommitView(APIView):
    permission_classes = [IsITAdminOrSuperAdmin]

    def post(self, request):
        session_id = request.data.get("session_id")
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
            model_name="Asset",
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
