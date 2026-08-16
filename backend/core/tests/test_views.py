import pytest
from django.contrib.auth.hashers import make_password
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
        {
            "username": "newuser",
            "email": "new@example.com",
            "password": "pass1234",
            "security_questions": [
                {"question": "First pet?", "answer": "Rex"},
                {"question": "Birth city?", "answer": "Regina"},
                {"question": "First school?", "answer": "Elm"},
            ],
        },
        format="json",
    )
    assert response.status_code == 201
    assert User.objects.filter(username="newuser").exists()


@pytest.mark.django_db
def test_register_rejects_duplicate_questions(api_client):
    response = api_client.post(
        "/api/auth/register",
        {
            "username": "dupq",
            "email": "dupq@example.com",
            "password": "pass1234",
            "security_questions": [
                {"question": "First pet?", "answer": "Rex"},
                {"question": "First pet?", "answer": "Rex"},
                {"question": "First pet?", "answer": "Rex"},
            ],
        },
        format="json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_register_requires_three_questions(api_client):
    response = api_client.post(
        "/api/auth/register",
        {"username": "noq", "email": "noq@example.com", "password": "pass1234"},
        format="json",
    )
    assert response.status_code == 400


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


@pytest.fixture
def question_user():
    user = User.objects.create_user("qa", "qa@example.com", "oldpass123")
    user.security_questions = [
        {"question": "First pet?", "answer": make_password("rex")},
        {"question": "Birth city?", "answer": make_password("regina")},
        {"question": "First school?", "answer": make_password("elm")},
    ]
    user.save()
    return user


@pytest.mark.django_db
def test_security_question_returned(api_client, question_user):
    response = api_client.post(
        "/api/auth/security-question", {"email": "QA@example.com"}, format="json"
    )
    assert response.status_code == 200
    assert response.data["questions"] == ["First pet?", "Birth city?", "First school?"]


@pytest.mark.django_db
def test_security_question_unknown_email(api_client):
    response = api_client.post(
        "/api/auth/security-question", {"email": "nobody@example.com"}, format="json"
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_security_answer_correct_returns_reset_token(api_client, question_user):
    response = api_client.post(
        "/api/auth/security-answer",
        {"email": "qa@example.com", "answers": ["  REX ", "Regina", "elm"]},
        format="json",
    )
    assert response.status_code == 200
    confirm = api_client.post(
        "/api/auth/password-reset-confirm",
        {
            "uid": response.data["uid"],
            "token": response.data["token"],
            "password": "newpass456",
        },
        format="json",
    )
    assert confirm.status_code == 200
    question_user.refresh_from_db()
    assert question_user.check_password("newpass456")


@pytest.mark.django_db
def test_security_answer_one_wrong_is_rejected(api_client, question_user):
    """Two of three right is still a failure."""
    response = api_client.post(
        "/api/auth/security-answer",
        {"email": "qa@example.com", "answers": ["rex", "regina", "fluffy"]},
        format="json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_security_answer_too_few_answers(api_client, question_user):
    response = api_client.post(
        "/api/auth/security-answer",
        {"email": "qa@example.com", "answers": ["rex"]},
        format="json",
    )
    assert response.status_code == 400
