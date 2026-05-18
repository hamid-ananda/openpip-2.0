from django.urls import path
from .views import InteractionCategoryListView, SearchView, SearchInteractorsView

urlpatterns = [
    path("interactions/categories", InteractionCategoryListView.as_view()),
    path("search", SearchView.as_view()),
    path("search/interactors", SearchInteractorsView.as_view()),
]
