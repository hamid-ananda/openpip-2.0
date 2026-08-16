from django.urls import path

from .views import (
    PsicquicCountView,
    PsicquicFormatsView,
    PsicquicQueryView,
    PsicquicVersionView,
)

urlpatterns = [
    path("rest/query", PsicquicQueryView.as_view(), name="psicquic-query"),
    path("rest/query/count", PsicquicCountView.as_view(), name="psicquic-count"),
    path("rest/formats", PsicquicFormatsView.as_view(), name="psicquic-formats"),
    path("rest/version", PsicquicVersionView.as_view(), name="psicquic-version"),
]
