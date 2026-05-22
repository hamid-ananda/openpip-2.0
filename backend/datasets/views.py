import csv
import io
import logging
import os
import tempfile
import time
import zipfile

from celery.result import AsyncResult

from django.db.models import Count, OuterRef, Subquery
from django.http import FileResponse, Http404, StreamingHttpResponse
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from interactions.models import Interaction, InteractionDataset
from proteins.models import Identifier
from .models import Dataset
from .serializers import DatasetSerializer
from .upload_parser import parse_and_ingest, fast_preview, process_line_batch
from .tasks import import_dataset_task

logger = logging.getLogger(__name__)


def _refresh_dataset_counts() -> None:
    """Update number_of_interactions for all datasets from InteractionDataset records."""
    Dataset.objects.update(
        number_of_interactions=Subquery(
            InteractionDataset.objects.filter(dataset_id=OuterRef("pk"))
            .values("dataset_id")
            .annotate(c=Count("id"))
            .values("c")
        )
    )


class DatasetListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        datasets = Dataset.objects.all().order_by("id")
        return Response(DatasetSerializer(datasets, many=True).data)


class DatasetFileDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        dataset = Dataset.objects.filter(pk=pk).first()
        if not dataset:
            raise Http404

        fmt = request.query_params.get("fmt", "tab").lower()
        if fmt not in ("tab", "sif", "csv"):
            fmt = "tab"

        rows = (
            InteractionDataset.objects.filter(dataset_id=pk)
            .select_related(
                "interaction__interactor_A",
                "interaction__interactor_B",
            )
            .only(
                "interaction__score",
                "interaction__interactor_A__uniprot_id",
                "interaction__interactor_A__gene_name",
                "interaction__interactor_B__uniprot_id",
                "interaction__interactor_B__gene_name",
            )
        )

        safe_name = dataset.name.replace(" ", "_") if dataset.name else f"dataset_{pk}"

        if fmt == "tab":
            content_type = "text/tab-separated-values"
            filename = f"{safe_name}.tab"
            body = self._generate_tab(rows, dataset)
        elif fmt == "sif":
            content_type = "text/plain"
            filename = f"{safe_name}.sif"
            body = self._generate_sif(rows)
        else:
            content_type = "text/csv"
            filename = f"{safe_name}.csv"
            body = self._generate_csv(rows, dataset)

        response = StreamingHttpResponse(body, content_type=content_type)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    def _generate_tab(self, rows, dataset):
        header = (
            "#ID(s) interactor A\tID(s) interactor B\t"
            "Confidence value(s)\tPublication identifier(s)\n"
        )
        yield header
        pubmed = f"pubmed:{dataset.pubmed_id}" if dataset.pubmed_id else "-"
        for id_row in rows:
            ix = id_row.interaction
            a = ix.interactor_A
            b = ix.interactor_B
            uid_a = f"uniprotkb:{a.uniprot_id}" if a.uniprot_id else a.gene_name or "-"
            uid_b = f"uniprotkb:{b.uniprot_id}" if b.uniprot_id else b.gene_name or "-"
            score = f"score:{ix.score}" if ix.score else "-"
            yield f"{uid_a}\t{uid_b}\t{score}\t{pubmed}\n"

    def _generate_sif(self, rows):
        for id_row in rows:
            ix = id_row.interaction
            a = ix.interactor_A
            b = ix.interactor_B
            name_a = a.gene_name or a.uniprot_id or str(a.pk)
            name_b = b.gene_name or b.uniprot_id or str(b.pk)
            yield f"{name_a}\tinteracts\t{name_b}\n"

    def _generate_csv(self, rows, dataset):
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(
            ["gene_a", "gene_b", "uniprot_a", "uniprot_b", "score", "dataset"]
        )
        yield buf.getvalue()
        for id_row in rows:
            ix = id_row.interaction
            a = ix.interactor_A
            b = ix.interactor_B
            buf = io.StringIO()
            writer = csv.writer(buf)
            writer.writerow(
                [
                    a.gene_name or "",
                    b.gene_name or "",
                    a.uniprot_id or "",
                    b.uniprot_id or "",
                    ix.score or "",
                    dataset.name or "",
                ]
            )
            yield buf.getvalue()


class DatasetArchiveDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        datasets = Dataset.objects.exclude(file_path__isnull=True).exclude(file_path="")
        tmp = tempfile.NamedTemporaryFile(suffix=".zip", delete=False)
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zf:
            for ds in datasets:
                if ds.file_path and os.path.exists(ds.file_path):
                    zf.write(ds.file_path, arcname=os.path.basename(ds.file_path))
        tmp.seek(0)
        return FileResponse(
            open(tmp.name, "rb"), as_attachment=True, filename="datasets.zip"
        )


class UploadView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST
            )
        file_bytes = uploaded_file.read()
        result = parse_and_ingest(file_bytes, dataset_name="")
        return Response(result)


class ProteinCheckView(APIView):
    """Batch lookup: given a list of raw PSI-MI identifiers, return how many exist in the DB."""

    permission_classes = [IsAdminUser]

    def post(self, request):
        raw_ids = request.data.get("identifiers", [])
        if not isinstance(raw_ids, list) or not raw_ids:
            return Response({"existing": 0})

        clean_ids = [
            (r.split(":", 1)[1].strip() if ":" in r else r.strip()) for r in raw_ids
        ]
        t0 = time.monotonic()
        existing = Identifier.objects.filter(identifier__in=clean_ids).count()
        elapsed = (time.monotonic() - t0) * 1000
        logger.debug(
            "check-proteins: %d queried → %d existing, %d new  (%.1f ms)",
            len(clean_ids),
            existing,
            len(clean_ids) - existing,
            elapsed,
        )
        return Response({"existing": existing})


class DatasetPreviewView(APIView):
    """Dry-run parse: returns counts without writing anything to the database."""

    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST
            )
        if not request.data.get("dataset_name", "").strip():
            return Response(
                {"detail": "dataset_name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        file_bytes = uploaded_file.read()
        result = fast_preview(file_bytes)
        return Response(result, status=status.HTTP_200_OK)


class DatasetUploadView(APIView):
    """Full ingest: parses and writes all rows to the database."""

    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST
            )
        dataset_name = request.data.get("dataset_name", "").strip()
        if not dataset_name:
            return Response(
                {"detail": "dataset_name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        interaction_status = request.data.get("interaction_status", "published")
        category_id_raw = request.data.get("category_id")
        category_id = int(category_id_raw) if category_id_raw else None

        file_bytes = uploaded_file.read()
        result = parse_and_ingest(
            file_bytes,
            dataset_name=dataset_name,
            interaction_status=interaction_status,
            category_id=category_id,
            dry_run=False,
        )
        _refresh_dataset_counts()
        logger.debug("upload complete — refreshed dataset interaction counts")
        return Response(result, status=status.HTTP_201_CREATED)


class DatasetUploadRowsView(APIView):
    """Batched ingest: accepts pre-parsed TSV lines as JSON for progress-bar imports."""

    permission_classes = [IsAdminUser]

    def post(self, request):
        lines = request.data.get("lines", [])
        dataset_name = request.data.get("dataset_name", "").strip()
        if not dataset_name:
            return Response(
                {"detail": "dataset_name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(lines, list) or not lines:
            return Response(
                {"detail": "lines must be a non-empty list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        interaction_status = request.data.get("interaction_status", "published")
        category_id_raw = request.data.get("category_id")
        category_id = int(category_id_raw) if category_id_raw else None
        is_last_batch = bool(request.data.get("is_last_batch", False))

        t0 = time.monotonic()
        result = process_line_batch(
            lines, dataset_name, interaction_status, category_id
        )
        elapsed = (time.monotonic() - t0) * 1000

        logger.debug(
            "upload-rows: %d lines → %d interactions created, %d skipped, %d errors  (%.0f ms)%s",
            len(lines),
            result["interactions_created"],
            result["interactions_skipped"],
            len(result["errors"]),
            elapsed,
            "  [last batch — refreshing counts]" if is_last_batch else "",
        )
        if result["errors"]:
            logger.warning(
                "upload-rows first error (row %d): %s",
                result["errors"][0]["row"],
                result["errors"][0]["reason"],
            )

        if is_last_batch:
            _refresh_dataset_counts()

        return Response(result, status=status.HTTP_201_CREATED)


class DatasetDeleteView(APIView):
    """Delete a dataset and remove any interactions that are no longer linked to any dataset."""

    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        from django.db import transaction as db_transaction

        dataset = Dataset.objects.filter(pk=pk).first()
        if not dataset:
            raise Http404

        with db_transaction.atomic():
            # Collect interaction IDs linked only to this dataset before deleting
            orphan_ids = list(
                InteractionDataset.objects.filter(dataset_id=pk)
                .values_list("interaction_id", flat=True)
                .difference(
                    InteractionDataset.objects.filter(dataset_id=pk)
                    .values("interaction_id")
                    .filter(
                        interaction_id__in=InteractionDataset.objects.exclude(
                            dataset_id=pk
                        ).values("interaction_id")
                    )
                )
            )
            dataset.delete()  # cascades InteractionDataset rows
            orphaned_deleted = Interaction.objects.filter(pk__in=orphan_ids).delete()[0]
            _refresh_dataset_counts()

        logger.debug(
            "dataset %d deleted — %d orphaned interactions removed",
            pk,
            orphaned_deleted,
        )
        return Response(
            {"orphaned_interactions_deleted": orphaned_deleted},
            status=status.HTTP_200_OK,
        )


class AsyncImportView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser]

    def post(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST
            )

        dataset_name = request.data.get("dataset_name", "").strip()
        if not dataset_name:
            return Response(
                {"detail": "dataset_name required."}, status=status.HTTP_400_BAD_REQUEST
            )

        interaction_status = request.data.get("interaction_status", "published")
        category_id_raw = request.data.get("category_id")
        category_id = int(category_id_raw) if category_id_raw else None

        text = file_obj.read().decode("utf-8", errors="replace")
        lines = [
            line
            for line in text.splitlines()
            if line.strip() and not line.startswith("#")
        ]

        task = import_dataset_task.delay(
            lines, dataset_name, interaction_status, category_id
        )
        return Response({"task_id": task.id}, status=status.HTTP_202_ACCEPTED)


class AsyncImportStatusView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, task_id: str):
        result = AsyncResult(task_id)
        state = result.state

        if state == "SUCCESS":
            data = result.result or {}
        elif state == "FAILURE":
            data = {"error": str(result.info)}
        elif state in ("PROGRESS", "STARTED"):
            data = result.info or {}
        else:
            data = {}

        return Response(
            {
                "task_id": task_id,
                "status": state,
                "progress": data.get("progress", 0),
                "proteins_created": data.get("proteins_created", 0),
                "interactions_created": data.get("interactions_created", 0),
                "interactions_skipped": data.get("interactions_skipped", 0),
                "errors": data.get("errors", []),
            }
        )
