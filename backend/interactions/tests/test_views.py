import pytest
from proteins.tests.factories import (
    ProteinFactory,
    IdentifierFactory,
    ProteinIdentifierFactory,
)
from interactions.tests.factories import (
    InteractionFactory,
    InteractionCategoryFactory,
    InteractionInteractionCategoryFactory,
)
from datasets.tests.factories import DatasetFactory


def _make_protein_with_identifier(gene_name, uniprot_id="P00001"):
    protein = ProteinFactory(gene_name=gene_name, uniprot_id=uniprot_id)
    identifier = IdentifierFactory(identifier=gene_name, naming_convention="gene_name")
    ProteinIdentifierFactory(protein=protein, identifier=identifier)
    return protein


@pytest.mark.django_db
def test_search_returns_search_result_shape(api_client):
    _make_protein_with_identifier("BAD", "Q92934")
    response = api_client.get("/api/search?q=BAD")
    assert response.status_code == 200
    data = response.json()
    assert "all_proteins" in data
    assert "all_interactions" in data
    assert "query_protein_id_array" in data
    assert "found_protein_summary" in data
    assert "unfound_protein_summary" in data


@pytest.mark.django_db
def test_search_finds_proteins_case_insensitive(api_client):
    _make_protein_with_identifier("BRCA1")
    response = api_client.get("/api/search?q=brca1")
    assert response.status_code == 200
    data = response.json()
    assert len(data["all_proteins"]) >= 1
    gene_names = [p["protein_gene_name"] for p in data["all_proteins"]]
    assert "BRCA1" in gene_names


@pytest.mark.django_db
def test_search_found_unfound_summary(api_client):
    _make_protein_with_identifier("BAD")
    response = api_client.get("/api/search?q=BAD,NOTFOUND")
    assert response.status_code == 200
    data = response.json()
    assert data["found_protein_summary"] == "BAD"
    assert data["unfound_protein_summary"] == "NOTFOUND"


@pytest.mark.django_db
def test_search_returns_interactions(api_client):
    p1 = _make_protein_with_identifier("BAD", "Q92934")
    p2 = _make_protein_with_identifier("BCL2L1", "Q07817")
    cat = InteractionCategoryFactory(category_name="Published", order="1")
    dataset = DatasetFactory(
        name="HuRI",
        pubmed_id="24153252",
        author="Rolland et al.(2014)",
        year="2014",
        interaction_status="Published",
    )
    ix = InteractionFactory(interactor_A=p1, interactor_B=p2, removed="0", score="0.82")
    InteractionInteractionCategoryFactory(interaction=ix, interaction_category=cat)

    from interactions.models import InteractionDataset

    InteractionDataset.objects.create(interaction=ix, dataset=dataset)

    response = api_client.get("/api/search?q=BAD,BCL2L1")
    assert response.status_code == 200
    data = response.json()
    assert len(data["all_interactions"]) == 1
    ix_data = data["all_interactions"][0]
    assert ix_data["interactor_A"]["protein_gene_name"] in ("BAD", "BCL2L1")
    assert ix_data["score"] == 0.82
    assert len(ix_data["dataset_array"]) == 1
    assert ix_data["dataset_array"][0]["name"] == "HuRI"
    assert (
        ix_data["interaction_category_array"]["highest_category_status"] == "Published"
    )


@pytest.mark.django_db
def test_search_excludes_removed_interactions(api_client):
    p1 = _make_protein_with_identifier("BAD")
    p2 = _make_protein_with_identifier("BCL2L1")
    InteractionFactory(interactor_A=p1, interactor_B=p2, removed="1")
    response = api_client.get("/api/search?q=BAD,BCL2L1")
    assert response.status_code == 200
    assert len(response.json()["all_interactions"]) == 0


@pytest.mark.django_db
def test_search_interactors_endpoint(api_client):
    p1 = _make_protein_with_identifier("BAD")
    p2 = _make_protein_with_identifier("BCL2L1")
    InteractionFactory(interactor_A=p1, interactor_B=p2, removed="0")
    response = api_client.post(
        "/api/search/interactors",
        {
            "searchTerm": "BAD,BCL2L1",
            "filterParameter": "query_query",
            "searchTermArray": ["BAD", "BCL2L1"],
            "queryIdArray": [p1.id, p2.id],
        },
        format="json",
    )
    assert response.status_code == 200
    data = response.json()
    assert "all_proteins" in data
    assert "all_interactions" in data


@pytest.mark.django_db
def test_search_query_protein_is_last_in_all_proteins(api_client):
    """Query proteins must be last so Cytoscape renders them on top."""
    p_query = _make_protein_with_identifier("BAD")
    p_interactor = ProteinFactory(gene_name="INTERACTOR")
    InteractionFactory(interactor_A=p_query, interactor_B=p_interactor, removed="0")

    response = api_client.get("/api/search?q=BAD")
    data = response.json()
    protein_ids = [p["protein_id"] for p in data["all_proteins"]]
    assert protein_ids[-1] == p_query.id


@pytest.mark.django_db
def test_categories_endpoint_returns_all_categories(api_client):
    InteractionCategoryFactory(category_name="Published", order="1")
    InteractionCategoryFactory(category_name="Validated", order="2")
    response = api_client.get("/api/interactions/categories")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["category_name"] == "Published"
    assert data[0]["order"] == "1"
    assert "id" in data[0]


@pytest.mark.django_db
def test_categories_endpoint_is_public(api_client):
    InteractionCategoryFactory(category_name="HI-Union", order="3")
    response = api_client.get("/api/interactions/categories")
    assert response.status_code == 200
    assert len(response.json()) == 1
