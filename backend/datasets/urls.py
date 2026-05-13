from django.urls import path
from .views import (
    DatasetListView,
    DatasetFileDownloadView,
    DatasetArchiveDownloadView,
    DatasetPreviewView,
    DatasetUploadView,
    UploadView,
)

urlpatterns = [
    path("datasets", DatasetListView.as_view()),
    path("datasets/download/", DatasetArchiveDownloadView.as_view()),
    path(
        "datasets/<str:dataset_reference>/download", DatasetFileDownloadView.as_view()
    ),
    path("upload/", UploadView.as_view()),
    path("datasets/preview", DatasetPreviewView.as_view()),
    path("datasets/upload", DatasetUploadView.as_view()),
]
