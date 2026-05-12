from rest_framework import serializers
from .models import Dataset


class DatasetSerializer(serializers.ModelSerializer):
    dataset_reference = serializers.SerializerMethodField()
    dataset_author = serializers.SerializerMethodField()
    interaction_status = serializers.CharField()

    class Meta:
        model = Dataset
        fields = [
            "dataset_reference",
            "dataset_author",
            "year",
            "description",
            "interaction_status",
            "name",
        ]

    def get_dataset_reference(self, obj):
        return obj.pubmed_id or ""

    def get_dataset_author(self, obj):
        return obj.author if obj.author else "Unpublished Dataset"
