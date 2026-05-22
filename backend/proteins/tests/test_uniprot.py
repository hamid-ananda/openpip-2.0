"""TDD tests for the UniProt enrichment module."""

from unittest.mock import MagicMock, patch

import pytest

from proteins.tests.factories import ProteinFactory


UNIPROT_ENTRY = {
    "primaryAccession": "P12345",
    "proteinDescription": {
        "recommendedName": {"fullName": {"value": "Apoptosis regulator BAX"}}
    },
    "genes": [{"geneName": {"value": "BAX"}}],
    "sequence": {"value": "MSEQSEQSEQ"},
    "comments": [
        {
            "commentType": "FUNCTION",
            "texts": [{"value": "Accelerates programmed cell death."}],
        }
    ],
}


# ── fetch_uniprot_data ────────────────────────────────────────────────────────


def test_fetch_uniprot_data_empty_accessions_returns_empty():
    from proteins.uniprot import fetch_uniprot_data

    result = fetch_uniprot_data([])
    assert result == {}


def test_fetch_uniprot_data_calls_uniprot_search_api():
    from proteins.uniprot import fetch_uniprot_data

    mock_resp = MagicMock()
    mock_resp.json.return_value = {"results": [UNIPROT_ENTRY]}
    mock_resp.raise_for_status = MagicMock()

    with patch("proteins.uniprot.requests.get", return_value=mock_resp) as mock_get:
        fetch_uniprot_data(["P12345"])

    mock_get.assert_called_once()
    url = mock_get.call_args[0][0]
    assert "uniprot.org" in url


def test_fetch_uniprot_data_returns_dict_keyed_by_accession():
    from proteins.uniprot import fetch_uniprot_data

    mock_resp = MagicMock()
    mock_resp.json.return_value = {"results": [UNIPROT_ENTRY]}
    mock_resp.raise_for_status = MagicMock()

    with patch("proteins.uniprot.requests.get", return_value=mock_resp):
        result = fetch_uniprot_data(["P12345"])

    assert "P12345" in result
    assert result["P12345"] == UNIPROT_ENTRY


def test_fetch_uniprot_data_returns_empty_on_no_results():
    from proteins.uniprot import fetch_uniprot_data

    mock_resp = MagicMock()
    mock_resp.json.return_value = {"results": []}
    mock_resp.raise_for_status = MagicMock()

    with patch("proteins.uniprot.requests.get", return_value=mock_resp):
        result = fetch_uniprot_data(["UNKNOWN"])

    assert result == {}


# ── enrich_proteins_from_uniprot ─────────────────────────────────────────────


@pytest.mark.django_db
def test_enrich_fills_missing_protein_name_and_sequence():
    from proteins.uniprot import enrich_proteins_from_uniprot

    protein = ProteinFactory(
        uniprot_id="P12345", protein_name=None, sequence=None, description=None
    )

    with patch(
        "proteins.uniprot.fetch_uniprot_data", return_value={"P12345": UNIPROT_ENTRY}
    ):
        count = enrich_proteins_from_uniprot([protein.id])

    protein.refresh_from_db()
    assert count == 1
    assert protein.protein_name == "Apoptosis regulator BAX"
    assert protein.sequence == "MSEQSEQSEQ"
    assert protein.description == "Accelerates programmed cell death."


@pytest.mark.django_db
def test_enrich_fills_missing_gene_name():
    from proteins.uniprot import enrich_proteins_from_uniprot

    protein = ProteinFactory(uniprot_id="P12345", gene_name=None)

    with patch(
        "proteins.uniprot.fetch_uniprot_data", return_value={"P12345": UNIPROT_ENTRY}
    ):
        enrich_proteins_from_uniprot([protein.id])

    protein.refresh_from_db()
    assert protein.gene_name == "BAX"


@pytest.mark.django_db
def test_enrich_does_not_overwrite_existing_fields():
    from proteins.uniprot import enrich_proteins_from_uniprot

    protein = ProteinFactory(
        uniprot_id="P12345",
        protein_name="Existing name",
        gene_name="EXISTING",
        sequence="EXISTINGSEQ",
        description="Existing desc",
    )

    with patch(
        "proteins.uniprot.fetch_uniprot_data", return_value={"P12345": UNIPROT_ENTRY}
    ):
        enrich_proteins_from_uniprot([protein.id])

    protein.refresh_from_db()
    assert protein.protein_name == "Existing name"
    assert protein.gene_name == "EXISTING"
    assert protein.sequence == "EXISTINGSEQ"
    assert protein.description == "Existing desc"


@pytest.mark.django_db
def test_enrich_skips_proteins_without_uniprot_id():
    from proteins.uniprot import enrich_proteins_from_uniprot

    protein = ProteinFactory(uniprot_id=None, gene_name="BAX")

    with patch("proteins.uniprot.fetch_uniprot_data") as mock_fetch:
        count = enrich_proteins_from_uniprot([protein.id])

    mock_fetch.assert_not_called()
    assert count == 0


@pytest.mark.django_db
def test_enrich_returns_zero_when_uniprot_has_no_data():
    from proteins.uniprot import enrich_proteins_from_uniprot

    protein = ProteinFactory(uniprot_id="P99999", protein_name=None)

    with patch("proteins.uniprot.fetch_uniprot_data", return_value={}):
        count = enrich_proteins_from_uniprot([protein.id])

    assert count == 0


@pytest.mark.django_db
def test_enrich_returns_zero_on_api_error():
    from proteins.uniprot import enrich_proteins_from_uniprot
    import requests

    protein = ProteinFactory(uniprot_id="P12345", protein_name=None)

    with patch(
        "proteins.uniprot.fetch_uniprot_data",
        side_effect=requests.RequestException("timeout"),
    ):
        count = enrich_proteins_from_uniprot([protein.id])

    assert count == 0
