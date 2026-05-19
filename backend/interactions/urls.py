from django.urls import path
from .views import (
    HomeNetworkView,
    InteractionCategoryListView,
    SearchView,
    SearchInteractorsView,
    SavedNetworkListView,
    SavedNetworkDetailView,
)

urlpatterns = [
    path("interactions/categories", InteractionCategoryListView.as_view()),
    path("home/network", HomeNetworkView.as_view()),
    path("search", SearchView.as_view()),
    path("search/interactors", SearchInteractorsView.as_view()),
    path("networks", SavedNetworkListView.as_view()),
    path("networks/<int:pk>", SavedNetworkDetailView.as_view()),
]
