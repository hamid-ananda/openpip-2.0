import pytest
import httpx
import respx

BASE_URL = "https://openpip.usask.ca"


@pytest.fixture
def mock_api():
    with respx.mock(base_url=BASE_URL, assert_all_called=False) as mock:
        yield mock


@pytest.fixture
def mock_search(mock_api):
    mock_api.get("/api/search/").mock(return_value=httpx.Response(200, json={
        "results": [
            {"id": 1, "gene_name": "BRCA1", "uniprot_id": "P38398"},
            {"id": 2, "gene_name": "BRCA2", "uniprot_id": "P51587"},
        ],
        "count": 2, "next": None, "previous": None,
    }))
    return mock_api
