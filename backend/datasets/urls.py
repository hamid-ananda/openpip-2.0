from django.urls import path
from .views import (
    DatasetListView,
    DatasetFileDownloadView,
    DatasetArchiveDownloadView,
    DatasetPreviewView,
    DatasetUploadView,
    UploadView,
)
from .file_views import FileListView, FileDetailView, FileDownloadView, PublicFileListView

urlpatterns = [
    path("datasets", DatasetListView.as_view()),
    path("datasets/download/", DatasetArchiveDownloadView.as_view()),
    path("datasets/<int:pk>/download", DatasetFileDownloadView.as_view()),
    path("upload/", UploadView.as_view()),
    path("datasets/preview", DatasetPreviewView.as_view()),
    path("datasets/upload", DatasetUploadView.as_view()),
    path("files", FileListView.as_view()),
    path("files/<int:pk>", FileDetailView.as_view()),
    path("files/<int:pk>/download", FileDownloadView.as_view()),
    path("files/public", PublicFileListView.as_view()),
]
