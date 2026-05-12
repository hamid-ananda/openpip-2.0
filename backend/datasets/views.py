import os
import tempfile
import zipfile

from django.http import FileResponse, Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Dataset
from .serializers import DatasetSerializer


class DatasetListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        datasets = Dataset.objects.all().order_by('id')
        return Response(DatasetSerializer(datasets, many=True).data)


class DatasetFileDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, dataset_reference):
        dataset = Dataset.objects.filter(pubmed_id=dataset_reference).first()
        if not dataset or not dataset.file_path:
            raise Http404
        if not os.path.exists(dataset.file_path):
            raise Http404
        return FileResponse(open(dataset.file_path, 'rb'), as_attachment=True,
                            filename=os.path.basename(dataset.file_path))


class DatasetArchiveDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        datasets = Dataset.objects.exclude(file_path__isnull=True).exclude(file_path='')
        tmp = tempfile.NamedTemporaryFile(suffix='.zip', delete=False)
        with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zf:
            for ds in datasets:
                if ds.file_path and os.path.exists(ds.file_path):
                    zf.write(ds.file_path, arcname=os.path.basename(ds.file_path))
        tmp.seek(0)
        return FileResponse(open(tmp.name, 'rb'), as_attachment=True, filename='datasets.zip')
