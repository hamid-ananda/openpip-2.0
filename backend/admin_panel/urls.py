from django.urls import path
from .views import AdminSettingsView, AnnouncementListView, CountsView

urlpatterns = [
    path('settings', AdminSettingsView.as_view()),
    path('announcements', AnnouncementListView.as_view()),
    path('counts', CountsView.as_view()),
]
