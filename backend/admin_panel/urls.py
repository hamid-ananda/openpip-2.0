from django.urls import path
from .views import AdminSettingsView, AnnouncementListView, CountsView, LogoUploadView

urlpatterns = [
    path("settings", AdminSettingsView.as_view()),
    path("settings/logo", LogoUploadView.as_view()),
    path("announcements", AnnouncementListView.as_view()),
    path("counts", CountsView.as_view()),
]
