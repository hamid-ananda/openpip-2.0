from django.urls import path
from .views import PsicquicQueryView, PsicquicCountView

urlpatterns = [
    path("rest/query", PsicquicQueryView.as_view(), name="psicquic-query"),
    path("rest/query/count", PsicquicCountView.as_view(), name="psicquic-count"),
]
