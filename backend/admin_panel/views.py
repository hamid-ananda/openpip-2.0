from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status

from proteins.models import Protein
from interactions.models import Interaction
from datasets.models import Dataset
from .models import AdminSettings, Announcement
from .serializers import (
    AdminSettingsSerializer,
    AdminUserSerializer,
    AnnouncementSerializer,
    InteractionCategorySerializer,
)
from interactions.models import InteractionCategory

User = get_user_model()


class AdminSettingsView(APIView):
    def get_permissions(self):
        if self.request.method == "PATCH":
            return [IsAdminUser()]
        return [AllowAny()]

    def get(self, request):
        settings = AdminSettings.objects.filter(pk=1).first()
        if not settings:
            return Response({}, status=status.HTTP_200_OK)
        return Response(AdminSettingsSerializer(settings).data)

    def patch(self, request):
        settings, _ = AdminSettings.objects.get_or_create(pk=1)
        serializer = AdminSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class LogoUploadView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        logo_file = request.FILES.get("logo")
        if not logo_file:
            return Response(
                {"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST
            )

        allowed_types = {
            "image/png",
            "image/jpeg",
            "image/gif",
            "image/svg+xml",
            "image/webp",
        }
        if logo_file.content_type not in allowed_types:
            return Response(
                {"detail": "Unsupported file type."}, status=status.HTTP_400_BAD_REQUEST
            )

        settings_obj, _ = AdminSettings.objects.get_or_create(pk=1)
        if settings_obj.logo:
            settings_obj.logo.delete(save=False)
        settings_obj.logo = logo_file
        settings_obj.save()
        return Response(AdminSettingsSerializer(settings_obj).data)

    def delete(self, request):
        settings_obj = AdminSettings.objects.filter(pk=1).first()
        if settings_obj and settings_obj.logo:
            settings_obj.logo.delete(save=False)
            settings_obj.logo = None
            settings_obj.save()
        return Response({"detail": "Logo removed."})


class AdminUserListView(APIView):
    """Existing accounts an admin can pick from, admins listed first."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = User.objects.all().order_by("-is_staff", "username")
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(Q(username__icontains=search) | Q(email__icontains=search))
        return Response(AdminUserSerializer(qs, many=True).data)


class AdminUserDetailView(APIView):
    """Grants or revokes admin access on an account that already exists.

    Registration deliberately never confers it — /api/auth/register is
    AllowAny, so promotion has to be an explicit act by a signed-in admin.

    Revoking is guarded so the panel cannot be made unreachable from inside
    itself. Self-revocation is refused, which also means the sole remaining
    admin can never drop the last set of keys; superusers are refused too,
    because is_staff gates /django-admin/ as well, so stripping it from them
    would close the fallback route with it.
    """

    permission_classes = [IsAdminUser]

    def patch(self, request, pk: int):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        is_admin = request.data.get("isAdmin")
        if not isinstance(is_admin, bool):
            return Response(
                {"isAdmin": "Expected true or false."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not is_admin:
            if user.pk == request.user.pk:
                return Response(
                    {"isAdmin": "You cannot revoke your own admin access."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if user.is_superuser:
                return Response(
                    {"isAdmin": "Superusers cannot have their admin access revoked."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Idempotent: re-applying the state an account already has is a no-op.
        if user.is_staff != is_admin:
            user.is_staff = is_admin
            user.save(update_fields=["is_staff"])
        return Response(AdminUserSerializer(user).data)


class AnnouncementListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Announcement.objects.filter(show_on_home_page=True).order_by("-date")
        return Response(AnnouncementSerializer(qs, many=True).data)


class AnnouncementAdminView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = Announcement.objects.all().order_by("-date")
        return Response(AnnouncementSerializer(qs, many=True).data)

    def post(self, request):
        serializer = AnnouncementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AnnouncementAdminDetailView(APIView):
    permission_classes = [IsAdminUser]

    def _get_object(self, pk: int):
        try:
            return Announcement.objects.get(pk=pk)
        except Announcement.DoesNotExist:
            return None

    def patch(self, request, pk: int):
        obj = self._get_object(pk)
        if obj is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AnnouncementSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk: int):
        obj = self._get_object(pk)
        if obj is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CountsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "proteins": Protein.objects.count(),
                "interactions": Interaction.objects.filter(removed="0").count(),
                "datasets": Dataset.objects.count(),
            }
        )


class InteractionCategoryListView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminUser()]
        return [AllowAny()]

    def get(self, request):
        qs = InteractionCategory.objects.filter(admin_settings_id=1).order_by("order")
        return Response(InteractionCategorySerializer(qs, many=True).data)

    def post(self, request):
        serializer = InteractionCategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        settings_obj, _ = AdminSettings.objects.get_or_create(pk=1)
        serializer.save(admin_settings=settings_obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InteractionCategoryDetailView(APIView):
    permission_classes = [IsAdminUser]

    def _get_object(self, pk: int):
        try:
            return InteractionCategory.objects.get(pk=pk, admin_settings_id=1)
        except InteractionCategory.DoesNotExist:
            return None

    def patch(self, request, pk: int):
        obj = self._get_object(pk)
        if obj is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = InteractionCategorySerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk: int):
        obj = self._get_object(pk)
        if obj is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
