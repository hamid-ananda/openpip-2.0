from rest_framework import serializers
from .models import AdminSettings, Announcement


class AdminSettingsSerializer(serializers.ModelSerializer):
    shortTitle = serializers.CharField(source='short_title', allow_null=True)
    homePage = serializers.CharField(source='home_page', allow_null=True)
    missionTitle = serializers.CharField(source='mission_title', allow_null=True)
    missionText = serializers.CharField(source='mission_text', allow_null=True)
    methodTitle = serializers.CharField(source='method_title', allow_null=True)
    methodText = serializers.CharField(source='method_text', allow_null=True)
    mainColorScheme = serializers.CharField(source='main_color_scheme', allow_null=True)
    headerColorScheme = serializers.CharField(source='header_color_scheme', allow_null=True)
    logoColorScheme = serializers.CharField(source='logo_color_scheme', allow_null=True)
    buttonColorScheme = serializers.CharField(source='button_color_scheme', allow_null=True)
    queryNodeColor = serializers.CharField(source='query_node_color', allow_null=True)
    interactorNodeColor = serializers.CharField(source='interactor_node_color', allow_null=True)
    publishedEdgeColor = serializers.CharField(source='published_edge_color', allow_null=True)
    validatedEdgeColor = serializers.CharField(source='validated_edge_color', allow_null=True)
    verifiedEdgeColor = serializers.CharField(source='verified_edge_color', allow_null=True)
    literatureEdgeColor = serializers.CharField(source='literature_edge_color', allow_null=True)

    class Meta:
        model = AdminSettings
        fields = [
            'title', 'shortTitle', 'footer', 'homePage',
            'missionTitle', 'missionText', 'methodTitle', 'methodText',
            'mainColorScheme', 'headerColorScheme', 'logoColorScheme', 'buttonColorScheme',
            'queryNodeColor', 'interactorNodeColor',
            'publishedEdgeColor', 'validatedEdgeColor', 'verifiedEdgeColor', 'literatureEdgeColor',
            'url', 'version',
        ]


class AnnouncementSerializer(serializers.ModelSerializer):
    showOnHomePage = serializers.BooleanField(source='show_on_home_page')

    class Meta:
        model = Announcement
        fields = ['id', 'title', 'text', 'date', 'showOnHomePage']
