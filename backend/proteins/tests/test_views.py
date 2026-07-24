import pytest
from proteins.tests.factories import (
    ProteinFactory,
    IdentifierFactory,
    ProteinIdentifierFactory,
)


@pytest.mark.django_db
def test_autocomplete_returns_matching_gene_names(api_client):
    p1 = ProteinFactory(gene_name="BAD")
    p2 = ProteinFactory(gene_name="BAK1")
    p3 = ProteinFactory(gene_name="TP53")
    i1 = IdentifierFactory(identifier="BAD", naming_convention="gene_name")
    i2 = IdentifierFactory(identifier="BAK1", naming_convention="gene_name")
    i3 = IdentifierFactory(identifier="TP53", naming_convention="gene_name")
    ProteinIdentifierFactory(protein=p1, identifier=i1)
    ProteinIdentifierFactory(protein=p2, identifier=i2)
    ProteinIdentifierFactory(protein=p3, identifier=i3)

    response = api_client.get("/api/proteins/autocomplete?q=BA")
    assert response.status_code == 200
    data = response.json()
    assert "BAD" in data
    assert "BAK1" in data
    assert "TP53" not in data


@pytest.mark.django_db
def test_autocomplete_ranks_prefix_matches_first(api_client):
    for name in ["ATP5A1", "ATP5B", "TP53", "TP53BP1"]:
        p = ProteinFactory(gene_name=name)
        i = IdentifierFactory(identifier=name, naming_convention="gene_name")
        ProteinIdentifierFactory(protein=p, identifier=i)

    data = api_client.get("/api/proteins/autocomplete?q=TP5").json()
    # Prefix matches (TP53, TP53BP1) rank above substring matches (ATP5*)
    assert data[0] == "TP53"
    assert data.index("TP53BP1") < data.index("ATP5A1")


@pytest.mark.django_db
def test_autocomplete_case_insensitive(api_client):
    p = ProteinFactory(gene_name="BRCA1")
    i = IdentifierFactory(identifier="BRCA1", naming_convention="gene_name")
    ProteinIdentifierFactory(protein=p, identifier=i)

    response = api_client.get("/api/proteins/autocomplete?q=brca")
    assert response.status_code == 200
    assert "BRCA1" in response.json()


@pytest.mark.django_db
def test_autocomplete_returns_empty_list_for_short_query(api_client):
    response = api_client.get("/api/proteins/autocomplete?q=B")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.django_db
def test_autocomplete_returns_empty_list_for_empty_query(api_client):
    response = api_client.get("/api/proteins/autocomplete")
    assert response.status_code == 200
    assert response.json() == []


# ── ProteinDetailView ─────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_protein_detail_found_by_identifier(api_client):
    protein = ProteinFactory(gene_name="BAD", uniprot_id="Q92934")
    ident = IdentifierFactory(identifier="BAD", naming_convention="gene_name")
    ProteinIdentifierFactory(protein=protein, identifier=ident)

    response = api_client.get("/api/proteins/BAD")
    assert response.status_code == 200
    data = response.json()
    assert data["protein_id"] == protein.id
    assert data["protein_gene_name"] == "BAD"
    assert data["protein_uniprot_id"] == "Q92934"


@pytest.mark.django_db
def test_protein_detail_response_shape(api_client):
    protein = ProteinFactory(gene_name="BAD")
    ident = IdentifierFactory(identifier="BAD", naming_convention="gene_name")
    ProteinIdentifierFactory(protein=protein, identifier=ident)

    response = api_client.get("/api/proteins/BAD")
    data = response.json()
    expected_keys = {
        "protein_id",
        "protein_gene_name",
        "protein_protein_name",
        "protein_uniprot_id",
        "protein_ensembl_id",
        "protein_entrez_id",
        "protein_description",
        "protein_sequence",
        "number_of_interactions_in_database",
        "annotation_array",
        "identifiers",
    }
    assert expected_keys.issubset(set(data.keys()))


@pytest.mark.django_db
def test_protein_detail_fallback_to_direct_gene_name(api_client):
    """No Identifier row exists — falls back to Protein.gene_name lookup."""
    ProteinFactory(gene_name="TP53")

    response = api_client.get("/api/proteins/TP53")
    assert response.status_code == 200
    assert response.json()["protein_gene_name"] == "TP53"


@pytest.mark.django_db
def test_protein_detail_fallback_to_uniprot_id(api_client):
    """No Identifier row and no gene_name match — falls back to uniprot_id."""
    ProteinFactory(gene_name=None, uniprot_id="P04637")

    response = api_client.get("/api/proteins/P04637")
    assert response.status_code == 200
    assert response.json()["protein_uniprot_id"] == "P04637"


@pytest.mark.django_db
def test_protein_detail_not_found_returns_404(api_client):
    response = api_client.get("/api/proteins/DOESNOTEXIST999")
    assert response.status_code == 404


@pytest.mark.django_db
def test_protein_detail_includes_annotation_array(api_client):
    from proteins.models import Annotation, AnnotationProtein

    protein = ProteinFactory(gene_name="BRCA1")
    ident = IdentifierFactory(identifier="BRCA1", naming_convention="gene_name")
    ProteinIdentifierFactory(protein=protein, identifier=ident)
    ann = Annotation.objects.create(
        annotation="DNA repair", type_name="function", identifier=protein.ensembl_id
    )
    AnnotationProtein.objects.create(annotation=ann, protein=protein)

    response = api_client.get("/api/proteins/BRCA1")
    data = response.json()
    assert "function" in data["annotation_array"]
    assert "DNA repair" in data["annotation_array"]["function"]


@pytest.mark.django_db
def test_protein_detail_includes_identifiers_list(api_client):
    protein = ProteinFactory(gene_name="BAD")
    ident1 = IdentifierFactory(identifier="BAD", naming_convention="gene_name")
    ident2 = IdentifierFactory(identifier="Q92934", naming_convention="uniprot")
    ProteinIdentifierFactory(protein=protein, identifier=ident1)
    ProteinIdentifierFactory(protein=protein, identifier=ident2)

    response = api_client.get("/api/proteins/BAD")
    data = response.json()
    identifiers = data["identifiers"]
    assert isinstance(identifiers, list)
    assert len(identifiers) == 2
    conventions = {i["naming_convention"] for i in identifiers}
    assert {"gene_name", "uniprot"} == conventions
