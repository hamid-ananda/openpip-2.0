from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework import status

from proteins.models import Protein
from interactions.models import Interaction
from .models import AdminSettings, Announcement
from .serializers import AdminSettingsSerializer, AnnouncementSerializer


class AdminSettingsView(APIView):
    def get_permissions(self):
        if self.request.method == 'PATCH':
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


class AnnouncementListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Announcement.objects.filter(show_on_home_page=True).order_by('-date')
        return Response(AnnouncementSerializer(qs, many=True).data)


class CountsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'proteins': Protein.objects.count(),
            'interactions': Interaction.objects.filter(removed='0').count(),
        })
