import pytest
import httpx
import respx
from openpip import OpenPIP
from openpip.models import Protein, Interaction, Dataset

BASE = "https://openpip.usask.ca"

SEARCH_RESPONSE = {
    "results": [
        {"id": 1, "gene_name": "BRCA1", "uniprot_id": "P38398"},
        {"id": 2, "gene_name": "BRCA2", "uniprot_id": "P51587"},
    ],
    "count": 2, "next": None, "previous": None,
}

PROTEIN_RESPONSE = {"id": 1, "gene_name": "BRCA1", "uniprot_id": "P38398"}

INTERACTIONS_RESPONSE = {
    "results": [{
        "id": 10,
        "interactor_A": {"id": 1, "gene_name": "BRCA1", "uniprot_id": "P38398"},
        "interactor_B": {"id": 2, "gene_name": "TP53", "uniprot_id": "P04637"},
        "score": "0.98",
    }],
    "count": 1, "next": None, "previous": None,
}

DATASET_RESPONSE = {
    "results": [{"id": 5, "name": "YeRI", "pubmed_id": "12345", "author": "Foo"}],
    "count": 1, "next": None, "previous": None,
}


@pytest.fixture
def sdk():
    return OpenPIP(url=BASE)


def test_search_returns_protein_list(sdk):
    with respx.mock(base_url=BASE) as mock:
        mock.get("/api/search/").mock(return_value=httpx.Response(200, json=SEARCH_RESPONSE))
        results = sdk.search("BRCA1")
    assert isinstance(results, list)
    assert len(results) == 2
    assert isinstance(results[0], Protein)
    assert results[0].gene_name == "BRCA1"


def test_search_as_dataframe(sdk):
    pytest.importorskip("pandas")
    with respx.mock(base_url=BASE) as mock:
        mock.get("/api/search/").mock(return_value=httpx.Response(200, json=SEARCH_RESPONSE))
        df = sdk.search("BRCA1", as_dataframe=True)
    import pandas as pd
    assert isinstance(df, pd.DataFrame)
    assert "gene_name" in df.columns
    assert len(df) == 2


def test_protein_returns_protein_model(sdk):
    with respx.mock(base_url=BASE) as mock:
        mock.get("/api/proteins/1/").mock(return_value=httpx.Response(200, json=PROTEIN_RESPONSE))
        result = sdk.protein(1)
    assert isinstance(result, Protein)
    assert result.uniprot_id == "P38398"


def test_interactions_returns_interaction_list(sdk):
    with respx.mock(base_url=BASE) as mock:
        mock.get("/api/interactions/").mock(return_value=httpx.Response(200, json=INTERACTIONS_RESPONSE))
        results = sdk.interactions(1)
    assert isinstance(results[0], Interaction)
    assert results[0].interactor_A.gene_name == "BRCA1"


def test_interactions_as_dataframe(sdk):
    pytest.importorskip("pandas")
    with respx.mock(base_url=BASE) as mock:
        mock.get("/api/interactions/").mock(return_value=httpx.Response(200, json=INTERACTIONS_RESPONSE))
        df = sdk.interactions(1, as_dataframe=True)
    assert "score" in df.columns


def test_datasets_returns_dataset_list(sdk):
    with respx.mock(base_url=BASE) as mock:
        mock.get("/api/datasets/").mock(return_value=httpx.Response(200, json=DATASET_RESPONSE))
        results = sdk.datasets()
    assert isinstance(results[0], Dataset)


def test_psicquic_returns_string(sdk):
    with respx.mock(base_url=BASE) as mock:
        mock.get("/psicquic/rest/query").mock(return_value=httpx.Response(
            200, text="#ID(s) interactor A\tuniprotkb:P38398\t...",
            headers={"Content-Type": "text/plain"}
        ))
        result = sdk.psicquic("BRCA1")
    assert isinstance(result, str)
    assert result.startswith("#ID(s)")
