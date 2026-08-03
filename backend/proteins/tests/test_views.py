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


@pytest.mark.django_db
def test_protein_detail_parses_tissue_and_subcellular_json(api_client):
    from proteins.models import Annotation, AnnotationProtein

    protein = ProteinFactory(gene_name="TP53")
    for type_name, blob in [
        ("tissue_expression", '{"liver": "12.4", "brain": "3.1"}'),
        ("subcellular_location", '{"nucleus": "validated"}'),
    ]:
        ann = Annotation.objects.create(annotation=blob, type_name=type_name)
        AnnotationProtein.objects.create(annotation=ann, protein=protein)

    data = api_client.get("/api/proteins/TP53").json()
    assert data["tissue_expression_array"] == {"liver": "12.4", "brain": "3.1"}
    assert data["subcellular_location_expression_array"] == {"nucleus": "validated"}


@pytest.mark.django_db
def test_protein_detail_json_arrays_empty_when_annotation_missing(api_client):
    ProteinFactory(gene_name="NOANN")
    data = api_client.get("/api/proteins/NOANN").json()
    assert data["tissue_expression_array"] == {}
    assert data["subcellular_location_expression_array"] == {}


# ── Protein list ──


@pytest.mark.django_db
def test_protein_list_returns_paginated_rows(api_client):
    for name in ["AKT1", "BAD", "TP53"]:
        ProteinFactory(gene_name=name)

    response = api_client.get("/api/proteins")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 3
    assert [row["protein_gene_name"] for row in data["results"]] == [
        "AKT1",
        "BAD",
        "TP53",
    ]


@pytest.mark.django_db
def test_protein_list_excludes_rows_without_gene_name_by_default(api_client):
    ProteinFactory(gene_name="TP53")
    ProteinFactory(gene_name="")
    ProteinFactory(gene_name=None)

    assert api_client.get("/api/proteins").json()["count"] == 1
    assert api_client.get("/api/proteins?include_empty=true").json()["count"] == 3


@pytest.mark.django_db
def test_protein_list_search_matches_gene_protein_name_and_identifier(api_client):
    ProteinFactory(gene_name="TP53", protein_name="Cellular tumor antigen p53")
    ProteinFactory(gene_name="AKT1", protein_name="RAC-alpha kinase")
    target = ProteinFactory(gene_name="MDM2", protein_name="E3 ligase")
    ident = IdentifierFactory(identifier="ENSG00000135679", naming_convention="ensembl")
    ProteinIdentifierFactory(protein=target, identifier=ident)

    by_gene = api_client.get("/api/proteins?q=TP5").json()
    assert [r["protein_gene_name"] for r in by_gene["results"]] == ["TP53"]

    by_protein_name = api_client.get("/api/proteins?q=kinase").json()
    assert [r["protein_gene_name"] for r in by_protein_name["results"]] == ["AKT1"]

    by_identifier = api_client.get("/api/proteins?q=ENSG00000135679").json()
    assert [r["protein_gene_name"] for r in by_identifier["results"]] == ["MDM2"]


@pytest.mark.django_db
def test_protein_list_search_ranks_exact_then_prefix_matches_first(api_client):
    for name in ["ATP53X", "TP53BP1", "TP53"]:
        ProteinFactory(gene_name=name)

    results = api_client.get("/api/proteins?q=TP53").json()["results"]
    assert [r["protein_gene_name"] for r in results] == ["TP53", "TP53BP1", "ATP53X"]


@pytest.mark.django_db
def test_protein_list_search_returns_one_row_per_protein(api_client):
    """Several matching identifiers on one protein must not duplicate its row."""
    protein = ProteinFactory(gene_name="TP53")
    for value in ["TP53", "TP53-1", "TP53-2"]:
        ident = IdentifierFactory(identifier=value, naming_convention="gene_name")
        ProteinIdentifierFactory(protein=protein, identifier=ident)

    data = api_client.get("/api/proteins?q=TP53").json()
    assert data["count"] == 1
    assert len(data["results"]) == 1


@pytest.mark.django_db
def test_protein_list_ordering_by_interaction_count(api_client):
    ProteinFactory(gene_name="LOW", number_of_interactions_in_database=2)
    ProteinFactory(gene_name="HIGH", number_of_interactions_in_database=99)

    results = api_client.get("/api/proteins?ordering=-interactions").json()["results"]
    assert [r["protein_gene_name"] for r in results] == ["HIGH", "LOW"]

    results = api_client.get("/api/proteins?ordering=interactions").json()["results"]
    assert [r["protein_gene_name"] for r in results] == ["LOW", "HIGH"]


@pytest.mark.django_db
def test_protein_list_ordering_treats_null_interaction_count_as_zero(api_client):
    """A null count is reported as 0, so it must not sort above real counts."""
    ProteinFactory(gene_name="UNKNOWN", number_of_interactions_in_database=None)
    ProteinFactory(gene_name="BUSY", number_of_interactions_in_database=644)

    results = api_client.get("/api/proteins?ordering=-interactions").json()["results"]
    assert [r["protein_gene_name"] for r in results] == ["BUSY", "UNKNOWN"]
    assert results[1]["number_of_interactions_in_database"] == 0

    results = api_client.get("/api/proteins?ordering=interactions").json()["results"]
    assert [r["protein_gene_name"] for r in results] == ["UNKNOWN", "BUSY"]


@pytest.mark.django_db
def test_protein_list_ordering_by_gene_puts_unnamed_rows_last(api_client):
    ProteinFactory(gene_name="ZZZ3")
    ProteinFactory(gene_name=None)

    for ordering in ["gene", "-gene"]:
        results = api_client.get(
            f"/api/proteins?include_empty=true&ordering={ordering}"
        ).json()["results"]
        assert results[0]["protein_gene_name"] == "ZZZ3", ordering


@pytest.mark.django_db
def test_protein_list_filters(api_client):
    ProteinFactory(gene_name="FULL", number_of_interactions_in_database=5)
    ProteinFactory(
        gene_name="BARE",
        number_of_interactions_in_database=0,
        sequence="",
        uniprot_id="",
    )

    for param in ["has_interactions", "has_sequence", "has_structure"]:
        results = api_client.get(f"/api/proteins?{param}=true").json()["results"]
        assert [r["protein_gene_name"] for r in results] == ["FULL"], param


@pytest.mark.django_db
def test_protein_list_respects_limit_and_offset(api_client):
    for name in ["A1", "B1", "C1"]:
        ProteinFactory(gene_name=name)

    data = api_client.get("/api/proteins?limit=2").json()
    assert [r["protein_gene_name"] for r in data["results"]] == ["A1", "B1"]

    data = api_client.get("/api/proteins?limit=2&offset=2").json()
    assert [r["protein_gene_name"] for r in data["results"]] == ["C1"]


@pytest.mark.django_db
def test_protein_list_row_reports_sequence_availability(api_client):
    ProteinFactory(gene_name="WITHSEQ", sequence="MSEQ")
    ProteinFactory(gene_name="NOSEQ", sequence=None)

    rows = {
        r["protein_gene_name"]: r
        for r in api_client.get("/api/proteins").json()["results"]
    }
    assert rows["WITHSEQ"]["has_sequence"] is True
    assert rows["NOSEQ"]["has_sequence"] is False


# ── Protein interactors ──


@pytest.mark.django_db
def test_protein_interactors_ranked_by_shared_evidence(api_client):
    from interactions.tests.factories import InteractionFactory

    query = ProteinFactory(gene_name="TP53")
    strong = ProteinFactory(gene_name="MDM2", number_of_interactions_in_database=7)
    weak = ProteinFactory(gene_name="BAX", number_of_interactions_in_database=3)

    # Two evidence rows for MDM2, one for BAX; one with the query on the B side.
    InteractionFactory(interactor_A=query, interactor_B=strong)
    InteractionFactory(interactor_A=strong, interactor_B=query)
    InteractionFactory(interactor_A=query, interactor_B=weak)

    data = api_client.get("/api/proteins/TP53/interactors").json()
    assert data["count"] == 2
    assert [r["protein_gene_name"] for r in data["results"]] == ["MDM2", "BAX"]
    assert data["results"][0]["shared_interaction_count"] == 2
    assert data["results"][0]["number_of_interactions_in_database"] == 7


@pytest.mark.django_db
def test_protein_interactors_skips_removed_and_self_interactions(api_client):
    from interactions.tests.factories import InteractionFactory

    query = ProteinFactory(gene_name="TP53")
    partner = ProteinFactory(gene_name="MDM2")
    dropped = ProteinFactory(gene_name="GONE")

    InteractionFactory(interactor_A=query, interactor_B=partner)
    InteractionFactory(interactor_A=query, interactor_B=query)
    InteractionFactory(interactor_A=query, interactor_B=dropped, removed="1")

    data = api_client.get("/api/proteins/TP53/interactors").json()
    assert [r["protein_gene_name"] for r in data["results"]] == ["MDM2"]


@pytest.mark.django_db
def test_protein_interactors_honours_limit(api_client):
    from interactions.tests.factories import InteractionFactory

    query = ProteinFactory(gene_name="TP53")
    for _ in range(5):
        InteractionFactory(interactor_A=query)

    data = api_client.get("/api/proteins/TP53/interactors?limit=2").json()
    assert data["count"] == 5
    assert len(data["results"]) == 2


@pytest.mark.django_db
def test_protein_interactors_unknown_protein_returns_404(api_client):
    assert api_client.get("/api/proteins/NOPE999/interactors").status_code == 404
