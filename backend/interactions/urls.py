from django.urls import path
from .views import (
    HomeNetworkView,
    InteractionCategoryListView,
    SearchView,
    SearchInteractorsView,
)

urlpatterns = [
    path("interactions/categories", InteractionCategoryListView.as_view()),
    path("home/network", HomeNetworkView.as_view()),
    path("search", SearchView.as_view()),
    path("search/interactors", SearchInteractorsView.as_view()),
]
