# backend/psicquic/tests/test_views.py
import pytest
from proteins.models import Protein, Organism, ProteinOrganism
from interactions.models import Interaction, InteractionDataset
from datasets.models import Dataset


@pytest.fixture
def sample_interactions(db):
    org = Organism.objects.create(name="Homo sapiens", taxonomy_id="9606")
    p1 = Protein.objects.create(gene_name="BRCA1", uniprot_id="P38398")
    p2 = Protein.objects.create(gene_name="TP53", uniprot_id="P04637")
    ProteinOrganism.objects.create(protein=p1, organism=org)
    ProteinOrganism.objects.create(protein=p2, organism=org)
    ds = Dataset.objects.create(name="DS1", pubmed_id="99999", author="Bar et al.")
    interaction = Interaction.objects.create(
        interactor_A=p1, interactor_B=p2, score="0.95"
    )
    InteractionDataset.objects.create(interaction=interaction, dataset=ds)
    return interaction


@pytest.mark.django_db
def test_psicquic_returns_tab25(client, sample_interactions):
    response = client.get("/psicquic/rest/query?q=BRCA1&format=tab25")
    assert response.status_code == 200
    assert response["Content-Type"] == "text/plain; charset=utf-8"
    content = response.content.decode()
    assert content.startswith("#ID(s) interactor A")
    assert "uniprotkb:P38398" in content
    assert "uniprotkb:P04637" in content


@pytest.mark.django_db
def test_psicquic_returns_json(client, sample_interactions):
    response = client.get("/psicquic/rest/query?q=BRCA1&format=json")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["interactor_a"]["uniprot_id"] == "P38398"


@pytest.mark.django_db
def test_psicquic_no_results(client, sample_interactions):
    response = client.get("/psicquic/rest/query?q=NONEXISTENT99&format=tab25")
    assert response.status_code == 200
    lines = response.content.decode().strip().split("\n")
    assert len(lines) == 1  # header only


@pytest.mark.django_db
def test_psicquic_pagination(client, sample_interactions):
    response = client.get(
        "/psicquic/rest/query?q=BRCA1&format=tab25&firstResult=0&maxResults=1"
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_psicquic_count_endpoint(client, sample_interactions):
    response = client.get("/psicquic/rest/query/count?q=BRCA1")
    assert response.status_code == 200
    assert response.content.decode().strip() == "1"


@pytest.mark.django_db
def test_psicquic_requires_no_auth(client, sample_interactions):
    """PSICQUIC endpoint must be public — no auth required."""
    response = client.get("/psicquic/rest/query?q=BRCA1&format=tab25")
    assert response.status_code != 401
    assert response.status_code != 403
