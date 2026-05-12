from rest_framework import serializers
from .models import Protein


class ProteinNestedSerializer(serializers.ModelSerializer):
    protein_id = serializers.IntegerField(source='id')
    protein_uniprot_id = serializers.CharField(source='uniprot_id', allow_null=True)
    protein_gene_name = serializers.CharField(source='gene_name', allow_null=True)
    protein_ensembl_id = serializers.CharField(source='ensembl_id', allow_null=True)

    class Meta:
        model = Protein
        fields = ['protein_id', 'protein_uniprot_id', 'protein_gene_name', 'protein_ensembl_id']
