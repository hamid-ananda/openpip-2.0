from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    NotificationViewSet,
    SavedViewViewSet,
    ShareCommentsView,
    ShareViewSet,
)

router = DefaultRouter()
router.register("saved-views", SavedViewViewSet, basename="saved-view")
router.register("shares", ShareViewSet, basename="share")
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("shares/<int:pk>/comments", ShareCommentsView.as_view()),
    path("", include(router.urls)),
]
