from django.urls import path
from .views import SearchView, SearchInteractorsView

urlpatterns = [
    path('search', SearchView.as_view()),
    path('search/interactors', SearchInteractorsView.as_view()),
]
