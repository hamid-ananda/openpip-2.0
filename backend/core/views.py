import logging

from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.views import TokenRefreshView
from .tokens import CustomRefreshToken

from .models import User

logger = logging.getLogger(__name__)
_token_generator = PasswordResetTokenGenerator()


SECURITY_QUESTION_COUNT = 3


def _normalize_answer(answer: str) -> str:
    """Case- and whitespace-insensitive, so 'My  Dog ' matches 'my dog'."""
    return " ".join(answer.split()).lower()


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "")
        password = request.data.get("password", "")
        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )
        refresh = CustomRefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "is_admin": user.is_staff,
            }
        )


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                token = CustomRefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        return Response({"detail": "Logged out"})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "").strip()
        email = request.data.get("email", "").strip()
        password = request.data.get("password", "").strip()
        pairs = request.data.get("security_questions") or []
        if not username or not email or not password:
            return Response(
                {"detail": "All fields required."}, status=status.HTTP_400_BAD_REQUEST
            )
        if not isinstance(pairs, list) or not all(isinstance(p, dict) for p in pairs):
            pairs = []
        questions = [str(p.get("question", "")).strip() for p in pairs]
        answers = [str(p.get("answer", "")).strip() for p in pairs]
        if (
            len(pairs) != SECURITY_QUESTION_COUNT
            or not all(questions)
            or not all(answers)
        ):
            return Response(
                {"detail": f"Answer {SECURITY_QUESTION_COUNT} security questions."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(set(questions)) != len(questions):
            return Response(
                {"detail": "Pick three different security questions."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if User.objects.filter(username=username).exists():
            return Response(
                {"detail": "Username already taken."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        User.objects.create_user(
            username=username,
            email=email,
            password=password,
            security_questions=[
                {"question": q, "answer": make_password(_normalize_answer(a))}
                for q, a in zip(questions, answers)
            ],
        )
        return Response(
            {"detail": "Registration successful"}, status=status.HTTP_201_CREATED
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                "username": user.username,
                "email": user.email,
                "is_admin": user.is_staff,
            }
        )


class SecurityQuestionView(APIView):
    """Step 1 of the reset flow: look up the questions set at registration."""

    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip()
        user = User.objects.filter(email__iexact=email).first()
        if user is None or not user.security_questions:
            return Response(
                {"detail": "No security questions are set for that email."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({"questions": [p["question"] for p in user.security_questions]})


class _SecurityAnswerThrottle(AnonRateThrottle):
    # CACHES points at Redis when REDIS_URL is set, so this counts across all
    # gunicorn workers rather than per process. Without it the effective limit
    # was silently 3x the configured one.
    scope = "security_answer"


class SecurityAnswerView(APIView):
    """Step 2: a correct answer hands back a normal password-reset token."""

    permission_classes = [AllowAny]
    throttle_classes = [_SecurityAnswerThrottle]

    def post(self, request):
        email = request.data.get("email", "").strip()
        answers = request.data.get("answers") or []
        user = User.objects.filter(email__iexact=email).first()
        stored = user.security_questions if user else []
        # Every answer must match, in the order the questions were returned.
        correct = len(answers) == len(stored) and all(
            check_password(_normalize_answer(str(given)), pair["answer"])
            for given, pair in zip(answers, stored)
        )
        if not stored or not correct:
            logger.info("Failed security answers for %s", email)
            return Response(
                {"detail": "Those answers are incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                "token": _token_generator.make_token(user),
            }
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get("uid", "")
        token = request.data.get("token", "")
        password = request.data.get("password", "").strip()

        if not uid or not token or not password:
            return Response(
                {"detail": "uid, token, and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(password) < 8:
            return Response(
                {"detail": "Password must be at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                {"detail": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST
            )

        if not _token_generator.check_token(user, token):
            return Response(
                {"detail": "Reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(password)
        user.save()
        logger.info("Password reset completed for user %s", user.username)
        return Response({"detail": "Password updated successfully."})


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    token_class = CustomRefreshToken


class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = CustomTokenRefreshSerializer
