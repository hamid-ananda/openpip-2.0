from rest_framework import serializers
from .models import AdminSettings, Announcement


class AdminSettingsSerializer(serializers.ModelSerializer):
    shortTitle = serializers.CharField(source='short_title', allow_null=True, required=False)
    homePage = serializers.CharField(source='home_page', allow_null=True, required=False)
    missionTitle = serializers.CharField(source='mission_title', allow_null=True, required=False)
    missionText = serializers.CharField(source='mission_text', allow_null=True, required=False)
    methodTitle = serializers.CharField(source='method_title', allow_null=True, required=False)
    methodText = serializers.CharField(source='method_text', allow_null=True, required=False)
    mainColorScheme = serializers.CharField(source='main_color_scheme', allow_null=True, required=False)
    headerColorScheme = serializers.CharField(source='header_color_scheme', allow_null=True, required=False)
    logoColorScheme = serializers.CharField(source='logo_color_scheme', allow_null=True, required=False)
    buttonColorScheme = serializers.CharField(source='button_color_scheme', allow_null=True, required=False)
    queryNodeColor = serializers.CharField(source='query_node_color', allow_null=True, required=False)
    interactorNodeColor = serializers.CharField(source='interactor_node_color', allow_null=True, required=False)
    publishedEdgeColor = serializers.CharField(source='published_edge_color', allow_null=True, required=False)
    validatedEdgeColor = serializers.CharField(source='validated_edge_color', allow_null=True, required=False)
    verifiedEdgeColor = serializers.CharField(source='verified_edge_color', allow_null=True, required=False)
    literatureEdgeColor = serializers.CharField(source='literature_edge_color', allow_null=True, required=False)
    logoUrl = serializers.SerializerMethodField()

    class Meta:
        model = AdminSettings
        fields = [
            'title', 'shortTitle', 'footer', 'homePage',
            'missionTitle', 'missionText', 'methodTitle', 'methodText',
            'mainColorScheme', 'headerColorScheme', 'logoColorScheme', 'buttonColorScheme',
            'queryNodeColor', 'interactorNodeColor',
            'publishedEdgeColor', 'validatedEdgeColor', 'verifiedEdgeColor', 'literatureEdgeColor',
            'url', 'version', 'logoUrl',
        ]

    def get_logoUrl(self, obj):
        if not obj.logo:
            return None
        return obj.logo.url


class AnnouncementSerializer(serializers.ModelSerializer):
    showOnHomePage = serializers.BooleanField(source='show_on_home_page')

    class Meta:
        model = Announcement
        fields = ['id', 'title', 'text', 'date', 'showOnHomePage']
