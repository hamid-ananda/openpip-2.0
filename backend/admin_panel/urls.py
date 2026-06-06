from django.urls import path
from .views import (
    AdminSettingsView,
    AnnouncementAdminDetailView,
    AnnouncementAdminView,
    AnnouncementListView,
    CountsView,
    InteractionCategoryDetailView,
    InteractionCategoryListView,
    LogoUploadView,
)

urlpatterns = [
    path("settings", AdminSettingsView.as_view()),
    path("settings/logo", LogoUploadView.as_view()),
    path("announcements", AnnouncementListView.as_view()),
    path("counts", CountsView.as_view()),
    path("admin/announcements", AnnouncementAdminView.as_view()),
    path("admin/announcements/<int:pk>", AnnouncementAdminDetailView.as_view()),
    path("interaction-categories", InteractionCategoryListView.as_view()),
    path("interaction-categories/<int:pk>", InteractionCategoryDetailView.as_view()),
]
