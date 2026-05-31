import pytest
import httpx
import respx
from openpip.client import APIClient

BASE = "https://openpip.usask.ca"


@pytest.fixture
def client():
    return APIClient(url=BASE)


def test_search_returns_raw_dict(client, mock_search):
    result = client.search("BRCA1")
    assert "results" in result
    assert result["results"][0]["gene_name"] == "BRCA1"


def test_protein_returns_raw_dict(client):
    with respx.mock(base_url=BASE) as mock:
        mock.get("/api/proteins/1/").mock(return_value=httpx.Response(200, json={
            "id": 1, "gene_name": "BRCA1", "uniprot_id": "P38398"
        }))
        result = client.protein(1)
    assert result["gene_name"] == "BRCA1"


def test_datasets_returns_list(client):
    with respx.mock(base_url=BASE) as mock:
        mock.get("/api/datasets/").mock(return_value=httpx.Response(200, json={
            "results": [{"id": 1, "name": "YeRI"}], "count": 1, "next": None, "previous": None
        }))
        result = client.datasets()
    assert "results" in result


def test_network_returns_nodes_edges(client):
    with respx.mock(base_url=BASE) as mock:
        mock.get("/api/network/1/").mock(return_value=httpx.Response(200, json={
            "nodes": [{"data": {"id": "1", "label": "BRCA1"}}],
            "edges": [],
        }))
        result = client.network(1)
    assert "nodes" in result


def test_psicquic_returns_text(client):
    with respx.mock(base_url=BASE) as mock:
        mock.get("/psicquic/rest/query").mock(return_value=httpx.Response(
            200, text="#ID(s) interactor A\tuniprotkb:P38398\t...",
            headers={"Content-Type": "text/plain"}
        ))
        result = client.psicquic("BRCA1", fmt="tab25")
    assert result.startswith("#ID(s)")


def test_not_found_raises(client):
    from openpip.exceptions import NotFound
    with respx.mock(base_url=BASE) as mock:
        mock.get("/api/proteins/9999/").mock(return_value=httpx.Response(404, json={"detail": "Not found."}))
        with pytest.raises(NotFound):
            client.protein(9999)
