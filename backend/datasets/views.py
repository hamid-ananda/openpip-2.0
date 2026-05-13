import os
import tempfile
import zipfile

from django.http import FileResponse, Http404
from rest_framework.parsers import MultiPartParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework import status

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

    def get(self, request, dataset_reference):
        dataset = Dataset.objects.filter(pubmed_id=dataset_reference).first()
        if not dataset or not dataset.file_path:
            raise Http404
        if not os.path.exists(dataset.file_path):
            raise Http404
        return FileResponse(
            open(dataset.file_path, "rb"),
            as_attachment=True,
            filename=os.path.basename(dataset.file_path),
        )


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
