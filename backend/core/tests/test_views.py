import pytest
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from core.models import User


@pytest.mark.django_db
def test_login_returns_tokens_and_is_admin(api_client):
    User.objects.create_superuser("admin", "admin@example.com", "password123")
    response = api_client.post(
        "/api/auth/login",
        {"username": "admin", "password": "password123"},
        format="json",
    )
    assert response.status_code == 200
    data = response.json()
    assert "access" in data
    assert "refresh" in data
    assert data["is_admin"] is True


@pytest.mark.django_db
def test_login_invalid_credentials(api_client):
    response = api_client.post(
        "/api/auth/login", {"username": "nobody", "password": "wrong"}, format="json"
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


@pytest.mark.django_db
def test_register_creates_user(api_client):
    response = api_client.post(
        "/api/auth/register",
        {"username": "newuser", "email": "new@example.com", "password": "pass1234"},
        format="json",
    )
    assert response.status_code == 201
    assert User.objects.filter(username="newuser").exists()


@pytest.mark.django_db
def test_register_duplicate_username(api_client):
    User.objects.create_user("existing", "e@example.com", "pass")
    response = api_client.post(
        "/api/auth/register",
        {"username": "existing", "email": "other@example.com", "password": "pass1234"},
        format="json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_me_returns_user_info(user_auth_client, regular_user):
    response = user_auth_client.get("/api/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == regular_user.username
    assert "is_admin" in data


@pytest.mark.django_db
def test_me_requires_auth(api_client):
    response = api_client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.django_db
def test_password_reset_request_unknown_email_returns_200(api_client):
    """Always returns 200 to prevent user enumeration."""
    response = api_client.post(
        "/api/auth/password-reset-request",
        {"email": "nobody@example.com"},
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_password_reset_request_sends_email(api_client, mailoutbox):
    User.objects.create_user("resetuser", "reset@example.com", "oldpass123")
    response = api_client.post(
        "/api/auth/password-reset-request",
        {"email": "reset@example.com"},
        format="json",
    )
    assert response.status_code == 200
    assert len(mailoutbox) == 1
    assert "reset@example.com" in mailoutbox[0].to
    assert "reset-password" in mailoutbox[0].body


@pytest.mark.django_db
def test_password_reset_confirm_success(api_client):
    user = User.objects.create_user("resetme", "me@example.com", "oldpass123")
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = PasswordResetTokenGenerator().make_token(user)
    response = api_client.post(
        "/api/auth/password-reset-confirm",
        {"uid": uid, "token": token, "password": "newpass456"},
        format="json",
    )
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.check_password("newpass456")


@pytest.mark.django_db
def test_password_reset_confirm_invalid_token(api_client):
    user = User.objects.create_user("badtoken", "bad@example.com", "oldpass123")
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    response = api_client.post(
        "/api/auth/password-reset-confirm",
        {"uid": uid, "token": "invalid-token", "password": "newpass456"},
        format="json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_password_reset_confirm_short_password(api_client):
    user = User.objects.create_user("shortpw", "short@example.com", "oldpass123")
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = PasswordResetTokenGenerator().make_token(user)
    response = api_client.post(
        "/api/auth/password-reset-confirm",
        {"uid": uid, "token": token, "password": "short"},
        format="json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_contact_returns_200(api_client):
    response = api_client.post(
        "/api/contact",
        {
            "name": "Alice",
            "email": "alice@example.com",
            "subject": "Hello",
            "message": "Test",
        },
        format="json",
    )
    assert response.status_code == 200
    assert response.json()["detail"] == "Message sent"
