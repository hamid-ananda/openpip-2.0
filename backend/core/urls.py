from django.urls import path
from .views import (
    LoginView,
    LogoutView,
    RegisterView,
    MeView,
    CustomTokenRefreshView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    SecurityQuestionView,
    SecurityAnswerView,
    OrcidConfigView,
    OrcidLoginView,
)

urlpatterns = [
    path("auth/login", LoginView.as_view()),
    path("auth/logout", LogoutView.as_view()),
    path("auth/token/refresh", CustomTokenRefreshView.as_view()),
    path("auth/register", RegisterView.as_view()),
    path("auth/me", MeView.as_view()),
    path("auth/password-reset-request", PasswordResetRequestView.as_view()),
    path("auth/password-reset-confirm", PasswordResetConfirmView.as_view()),
    path("auth/security-question", SecurityQuestionView.as_view()),
    path("auth/security-answer", SecurityAnswerView.as_view()),
    path("auth/orcid/config", OrcidConfigView.as_view()),
    path("auth/orcid/login", OrcidLoginView.as_view()),
]
