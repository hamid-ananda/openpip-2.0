import pytest
from proteins.serializers import ProteinNestedSerializer
from proteins.tests.factories import ProteinFactory


@pytest.mark.django_db
def test_protein_nested_serializer_returns_correct_fields():
    protein = ProteinFactory(
        gene_name="BRCA1",
        uniprot_id="P38398",
        ensembl_id="ENSG00000012048",
    )
    data = ProteinNestedSerializer(protein).data
    assert data["protein_id"] == protein.id
    assert data["protein_gene_name"] == "BRCA1"
    assert data["protein_uniprot_id"] == "P38398"
    assert data["protein_ensembl_id"] == "ENSG00000012048"
    assert set(data.keys()) == {
        "protein_id",
        "protein_uniprot_id",
        "protein_gene_name",
        "protein_ensembl_id",
    }


@pytest.mark.django_db
def test_protein_nested_serializer_handles_null_fields():
    protein = ProteinFactory(uniprot_id=None, gene_name=None, ensembl_id=None)
    data = ProteinNestedSerializer(protein).data
    assert data["protein_uniprot_id"] is None
    assert data["protein_gene_name"] is None
    assert data["protein_ensembl_id"] is None
