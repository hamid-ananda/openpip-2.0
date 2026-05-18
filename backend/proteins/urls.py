from django.urls import path
from .views import AutocompleteView, ProteinDetailView

urlpatterns = [
    path("proteins/autocomplete", AutocompleteView.as_view()),
    path("proteins/<str:identifier>", ProteinDetailView.as_view()),
]
