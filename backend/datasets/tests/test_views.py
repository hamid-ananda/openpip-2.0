import pytest
from datasets.tests.factories import DatasetFactory


@pytest.mark.django_db
def test_datasets_list_returns_dataset_refs(api_client):
    DatasetFactory(
        name="HuRI",
        pubmed_id="24153252",
        author="Rolland et al.(2014)",
        year="2014",
        interaction_status="Published",
        description="Human Reference Interactome",
    )
    DatasetFactory(
        name="Unpublished",
        pubmed_id="99999999",
        author=None,
        year="2020",
        interaction_status="Validated",
        description="Unpublished set",
    )

    response = api_client.get("/api/datasets")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    huri = next(d for d in data if d["name"] == "HuRI")
    assert huri["dataset_reference"] == "24153252"
    assert huri["dataset_author"] == "Rolland et al.(2014)"
    assert huri["interaction_status"] == "Published"

    unpub = next(d for d in data if d["name"] == "Unpublished")
    assert unpub["dataset_author"] == "Unpublished Dataset"
