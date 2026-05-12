from django.urls import path
from .views import LoginView, LogoutView, RegisterView, MeView, ContactView

urlpatterns = [
    path("auth/login", LoginView.as_view()),
    path("auth/logout", LogoutView.as_view()),
    path("auth/register", RegisterView.as_view()),
    path("auth/me", MeView.as_view()),
    path("contact", ContactView.as_view()),
]
