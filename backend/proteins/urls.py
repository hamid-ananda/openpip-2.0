from django.urls import path
from .views import AutocompleteView

urlpatterns = [
    path("proteins/autocomplete", AutocompleteView.as_view()),
]
