import csv
import io
import os
import tempfile
import zipfile

from django.http import FileResponse, Http404, StreamingHttpResponse
from rest_framework.parsers import MultiPartParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework import status

from interactions.models import InteractionDataset
from .models import Dataset
from .serializers import DatasetSerializer
from .upload_parser import parse_and_ingest


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
            dry_run=True,
        )
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
        return Response(result, status=status.HTTP_201_CREATED)
