# backend/psicquic/tests/test_views.py
import pytest
from proteins.models import Protein, Organism, ProteinOrganism
from interactions.models import Interaction, InteractionDataset
from datasets.models import Dataset
from psicquic.views import SUPPORTED_FORMATS, REST_VERSION, PsicquicThrottle


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


@pytest.mark.django_db
def test_psicquic_rejects_an_unsupported_format(client, sample_interactions):
    # Used to fall through and answer with TAB text, so a caller asking for XML
    # got tab-separated data it would then fail to parse.
    response = client.get("/psicquic/rest/query?q=BRCA1&format=xml25")
    assert response.status_code == 406
    body = response.content.decode()
    assert "xml25" in body
    assert "tab25" in body  # tells the caller what it can ask for instead


@pytest.mark.django_db
def test_psicquic_count_format_matches_the_count_endpoint(client, sample_interactions):
    via_format = client.get("/psicquic/rest/query?q=BRCA1&format=count")
    via_endpoint = client.get("/psicquic/rest/query/count?q=BRCA1")
    assert via_format.status_code == 200
    assert via_format.content == via_endpoint.content == b"1"


@pytest.mark.django_db
def test_psicquic_formats_lists_what_the_query_view_accepts(client):
    response = client.get("/psicquic/rest/formats")
    assert response.status_code == 200
    listed = response.content.decode().split()
    assert listed == list(SUPPORTED_FORMATS)
    # The registry validates a service against this list, so it must not drift
    # from what the query view actually answers.
    for fmt in listed:
        assert client.get(f"/psicquic/rest/query?q=*&format={fmt}").status_code == 200


@pytest.mark.django_db
def test_psicquic_version_reports_the_rest_spec_level(client):
    response = client.get("/psicquic/rest/version")
    assert response.status_code == 200
    assert response.content.decode().strip() == REST_VERSION


@pytest.mark.django_db
def test_psicquic_default_format_is_still_tab25(client, sample_interactions):
    response = client.get("/psicquic/rest/query?q=BRCA1")
    assert response.status_code == 200
    assert response.content.decode().startswith("#ID(s) interactor A")


@pytest.mark.django_db
def test_psicquic_rejects_non_numeric_paging(client, sample_interactions):
    # int() on a query param used to raise ValueError -> 500.
    response = client.get("/psicquic/rest/query?q=BRCA1&maxResults=all")
    assert response.status_code == 400


@pytest.mark.django_db
def test_psicquic_throttles_a_hammering_client(
    client, sample_interactions, monkeypatch
):
    # These endpoints are unauthenticated and return bulk data, so an unbounded
    # loop against them is the cheapest way to hurt the site.
    from django.core.cache import cache

    cache.clear()
    # THROTTLE_RATES is read into a class attribute at import time, so patching
    # settings at runtime would not reach it.
    monkeypatch.setattr(PsicquicThrottle, "THROTTLE_RATES", {"psicquic": "3/min"})
    codes = [client.get("/psicquic/rest/query?q=BRCA1").status_code for _ in range(5)]
    assert codes[:3] == [200, 200, 200]
    assert codes[3:] == [429, 429]
    cache.clear()


@pytest.mark.django_db
def test_psicquic_format_param_is_not_drf_content_negotiation(
    client, sample_interactions
):
    # DRF reads ?format= as a renderer override and 404s when it finds none.
    # PSICQUIC owns this parameter, so the view must see it, not DRF.
    assert client.get("/psicquic/rest/query?q=BRCA1&format=tab25").status_code == 200
    assert client.get("/psicquic/rest/query?q=BRCA1&format=json").status_code == 200


@pytest.mark.django_db
@pytest.mark.parametrize("fmt,width", [("tab25", 15), ("tab26", 36), ("tab27", 42)])
def test_psicquic_serves_each_tab_version(client, sample_interactions, fmt, width):
    response = client.get(f"/psicquic/rest/query?q=BRCA1&format={fmt}")
    assert response.status_code == 200
    rows = response.content.decode().strip().split("\n")
    assert all(row.count("\t") == width - 1 for row in rows)
