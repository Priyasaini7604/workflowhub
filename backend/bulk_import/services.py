"""
bulk_import/services.py

Generic, reusable CSV bulk-import engine.
Designed to be entity-agnostic: pass in a model, a create-serializer, and a
"duplicate key" field, and it handles CSV parsing, per-row validation,
duplicate detection, and (on commit) transactional bulk creation.

Used by both employees/views.py and assets/views.py so the two apps don't
duplicate this logic.
"""

import csv
import io
import json
import uuid
from dataclasses import dataclass, field
from typing import Optional

from django.core.cache import cache
from django.db import transaction


# ---------------------------------------------------------------------------
# Result data structures
# ---------------------------------------------------------------------------

@dataclass
class RowResult:
    # 1-indexed, matches spreadsheet row (header = row 1)
    row_number: int
    raw_data: dict
    status: str               # "valid" | "error" | "duplicate"
    errors: dict = field(default_factory=dict)   # field_name -> [messages]
    # set when status == "duplicate"
    matched_id: Optional[str] = None


@dataclass
class PreviewResult:
    session_id: str
    total_rows: int
    valid_count: int
    error_count: int
    duplicate_count: int
    rows: list  # list[RowResult]


# ---------------------------------------------------------------------------
# Core engine
# ---------------------------------------------------------------------------

class CSVBulkImporter:
    """
    entity_key:        short string, e.g. "employee" / "asset" — used to
                        namespace the cache key for the preview->commit handoff
    model:              the Django model (Employee / Asset)
    serializer_class:   the DRF serializer used to validate + create a row
                         (EmployeeCreateSerializer / AssetCreateSerializer)
    duplicate_field:    field name used to detect duplicates
                         ("email" for Employee, "serial_number" for Asset)
    required_columns:   CSV headers that must be present, else we fail fast
                         before even reading rows
    """

    # Preview data is cached for 30 min while the user reviews it in the UI,
    # then discarded — mirrors a "draft" without needing a DB table for it.
    PREVIEW_TTL_SECONDS = 30 * 60

    def __init__(self, entity_key, model, serializer_class, duplicate_field,
                 required_columns):
        self.entity_key = entity_key
        self.model = model
        self.serializer_class = serializer_class
        self.duplicate_field = duplicate_field
        self.required_columns = required_columns

    # -- Phase 1: parse + validate, no DB writes --------------------------

    def preview(self, uploaded_file) -> PreviewResult:
        rows = self._parse_csv(uploaded_file)

        results = []
        valid_count = error_count = duplicate_count = 0

        for row_number, raw_row in rows:
            cleaned = {k.strip(): (v.strip() if isinstance(v, str) else v)
                       for k, v in raw_row.items()}

            dup_id = self._find_duplicate(cleaned)
            if dup_id:
                results.append(RowResult(
                    row_number=row_number,
                    raw_data=cleaned,
                    status="duplicate",
                    matched_id=dup_id,
                ))
                duplicate_count += 1
                continue

            serializer = self.serializer_class(data=cleaned)
            if serializer.is_valid():
                results.append(RowResult(
                    row_number=row_number,
                    raw_data=cleaned,
                    status="valid",
                ))
                valid_count += 1
            else:
                # serializer.errors is DRF's ReturnDict (carries a reference
                # back to the serializer instance), which dataclasses.asdict()
                # can't reconstruct — round-trip through JSON to get plain
                # dicts/lists/strings that are safe to serialize downstream.
                results.append(RowResult(
                    row_number=row_number,
                    raw_data=cleaned,
                    status="error",
                    errors=json.loads(json.dumps(serializer.errors)),
                ))
                error_count += 1

        session_id = str(uuid.uuid4())
        preview = PreviewResult(
            session_id=session_id,
            total_rows=len(rows),
            valid_count=valid_count,
            error_count=error_count,
            duplicate_count=duplicate_count,
            rows=results,
        )

        # Stash the parsed+validated rows for the commit step, so the
        # frontend doesn't have to re-upload the whole file — it just sends
        # back the session_id plus per-row decisions for duplicates.
        cache.set(
            self._cache_key(session_id),
            [r.__dict__ for r in results],
            timeout=self.PREVIEW_TTL_SECONDS,
        )
        return preview

    # -- Phase 2: commit selected rows, inside one transaction -------------

    def commit(self, session_id, row_decisions, created_by):
        """
        row_decisions: dict mapping row_number (int) -> "skip" | "update" |
                       "create". Only relevant for rows that came back as
                       "duplicate" in the preview. "valid" rows are always
                       created unless explicitly skipped.
        Returns: (created_count, updated_count, skipped_count, failed_rows)
        """
        cached_rows = cache.get(self._cache_key(session_id))
        if cached_rows is None:
            raise ValueError(
                "Import session expired or not found — please re-upload the file."
            )

        created_count = updated_count = skipped_count = 0
        failed_rows = []

        with transaction.atomic():
            for row in cached_rows:
                row_number = row["row_number"]
                decision = row_decisions.get(row_number)
                status = row["status"]

                if status == "error":
                    # Errors are never committable — always skipped.
                    skipped_count += 1
                    continue

                if status == "duplicate":
                    if decision in (None, "skip"):
                        skipped_count += 1
                        continue
                    if decision == "update":
                        ok = self._update_existing(row)
                        if ok:
                            updated_count += 1
                        else:
                            failed_rows.append(row_number)
                        continue
                    # decision == "create": fall through to normal create

                # status == "valid", or duplicate explicitly forced to "create"
                serializer = self.serializer_class(data=row["raw_data"])
                if serializer.is_valid():
                    serializer.save()
                    created_count += 1
                else:
                    # Shouldn't normally happen (already validated at
                    # preview time), but data may have shifted since then.
                    failed_rows.append(row_number)

        cache.delete(self._cache_key(session_id))
        return created_count, updated_count, skipped_count, failed_rows

    # -- internals -----------------------------------------------------

    def _cache_key(self, session_id):
        return f"bulk_import:{self.entity_key}:{session_id}"

    def _parse_csv(self, uploaded_file):
        decoded = uploaded_file.read().decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(decoded))

        missing = set(self.required_columns) - set(reader.fieldnames or [])
        if missing:
            raise ValueError(
                f"CSV is missing required column(s): {
                    ', '.join(
                        sorted(missing))}")

        return [(i, row)
                for i, row in enumerate(reader, start=2)]  # row 1 = header

    def _find_duplicate(self, cleaned_row):
        value = cleaned_row.get(self.duplicate_field)
        if not value:
            return None
        existing = self.model.objects.filter(
            **{self.duplicate_field: value}, is_archived=False
        ).first()
        if not existing:
            return None
        # employee_id / asset_id may not exist yet (e.g. a Candidate-stage
        # record has no employee_id until joining), so fall back to the
        # row's own primary key so the frontend always has something to show.
        return (
            getattr(existing, "employee_id", None)
            or getattr(existing, "asset_id", None)
            or str(existing.pk)
        )

    def _update_existing(self, row):
        value = row["raw_data"].get(self.duplicate_field)
        instance = self.model.objects.filter(
            **{self.duplicate_field: value}, is_archived=False
        ).first()
        if not instance:
            return False
        serializer = self.serializer_class(
            instance, data=row["raw_data"], partial=True)
        if serializer.is_valid():
            serializer.save()
            return True
        return False
