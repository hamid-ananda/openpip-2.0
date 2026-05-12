from django.urls import path
from .views import DatasetListView, DatasetFileDownloadView, DatasetArchiveDownloadView

urlpatterns = [
    path('datasets', DatasetListView.as_view()),
    path('datasets/download/', DatasetArchiveDownloadView.as_view()),
    path('datasets/<str:dataset_reference>/download', DatasetFileDownloadView.as_view()),
]
