from rest_framework import serializers
from .models import Protein


class ProteinListSerializer(serializers.ModelSerializer):
    """Lightweight row for the browsable protein list — no sequence, no annotations."""

    # Nullable columns are surfaced as "" rather than null so the client never
    # has to null-guard every label — same contract as the detail endpoint.
    protein_id = serializers.IntegerField(source="id")
    protein_gene_name = serializers.SerializerMethodField()
    protein_protein_name = serializers.SerializerMethodField()
    protein_uniprot_id = serializers.SerializerMethodField()
    number_of_interactions_in_database = serializers.SerializerMethodField()
    has_sequence = serializers.SerializerMethodField()

    class Meta:
        model = Protein
        fields = [
            "protein_id",
            "protein_gene_name",
            "protein_protein_name",
            "protein_uniprot_id",
            "number_of_interactions_in_database",
            "has_sequence",
        ]

    def get_protein_gene_name(self, obj: Protein) -> str:
        return obj.gene_name or ""

    def get_protein_protein_name(self, obj: Protein) -> str:
        return obj.protein_name or ""

    def get_protein_uniprot_id(self, obj: Protein) -> str:
        return obj.uniprot_id or ""

    def get_number_of_interactions_in_database(self, obj: Protein) -> int:
        return obj.number_of_interactions_in_database or 0

    def get_has_sequence(self, obj: Protein) -> bool:
        return bool(obj.sequence)


class ProteinInteractorSerializer(serializers.Serializer):
    """One neighbour of a protein, with how much evidence connects the pair."""

    protein_id = serializers.IntegerField()
    protein_gene_name = serializers.CharField()
    protein_protein_name = serializers.CharField()
    protein_uniprot_id = serializers.CharField()
    number_of_interactions_in_database = serializers.IntegerField()
    shared_interaction_count = serializers.IntegerField()


class ProteinNestedSerializer(serializers.ModelSerializer):
    protein_id = serializers.IntegerField(source="id")
    protein_uniprot_id = serializers.CharField(source="uniprot_id", allow_null=True)
    protein_gene_name = serializers.CharField(source="gene_name", allow_null=True)
    protein_ensembl_id = serializers.CharField(source="ensembl_id", allow_null=True)

    class Meta:
        model = Protein
        fields = [
            "protein_id",
            "protein_uniprot_id",
            "protein_gene_name",
            "protein_ensembl_id",
        ]
