from django.urls import path
from .views import (
    AutocompleteView,
    ProteinDetailView,
    ProteinInteractorsView,
    ProteinListView,
)

urlpatterns = [
    path("proteins", ProteinListView.as_view()),
    path("proteins/autocomplete", AutocompleteView.as_view()),
    path("proteins/<str:identifier>/interactors", ProteinInteractorsView.as_view()),
    path("proteins/<str:identifier>", ProteinDetailView.as_view()),
]
