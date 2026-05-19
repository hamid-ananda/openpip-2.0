from rest_framework import serializers
from .models import InteractionNetwork


class SaveNetworkInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    query = serializers.CharField(max_length=100)
    score_parameter = serializers.CharField(max_length=100, default="0.00")
    category_array = serializers.CharField(max_length=100, allow_blank=True, default="")
    tissue_expression_array = serializers.CharField(
        max_length=100, allow_blank=True, default=""
    )
    interaction_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False
    )


class SavedNetworkListSerializer(serializers.ModelSerializer):
    interaction_count = serializers.SerializerMethodField()

    def get_interaction_count(self, obj):
        return obj.network_interactions.count()

    class Meta:
        model = InteractionNetwork
        fields = ["id", "name", "query", "interaction_count", "created_at"]
