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

UNIPROT_ENTRY_WITH_XREFS = {
    **UNIPROT_ENTRY,
    "uniProtKBCrossReferences": [
        {
            "database": "Ensembl",
            "id": "ENST00000315491",
            "properties": [
                {"key": "ProteinId", "value": "ENSP00000320396"},
                {"key": "GeneId", "value": "ENSG00000139618.17"},
            ],
        },
        {"database": "GeneID", "id": "675", "properties": []},
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


# ── _extract_ensembl_id / _extract_entrez_id ─────────────────────────────────


def test_extract_ensembl_id_returns_gene_id_without_version():
    from proteins.uniprot import _extract_ensembl_id

    result = _extract_ensembl_id(UNIPROT_ENTRY_WITH_XREFS)
    assert result == "ENSG00000139618"


def test_extract_ensembl_id_returns_empty_when_missing():
    from proteins.uniprot import _extract_ensembl_id

    assert _extract_ensembl_id({}) == ""
    assert _extract_ensembl_id(UNIPROT_ENTRY) == ""  # no cross-references in base fixture


def test_extract_entrez_id_returns_gene_id_string():
    from proteins.uniprot import _extract_entrez_id

    result = _extract_entrez_id(UNIPROT_ENTRY_WITH_XREFS)
    assert result == "675"


def test_extract_entrez_id_returns_empty_when_missing():
    from proteins.uniprot import _extract_entrez_id

    assert _extract_entrez_id({}) == ""


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
        count, had_error = enrich_proteins_from_uniprot([protein.id])

    protein.refresh_from_db()
    assert count == 1
    assert had_error is False
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
        count, had_error = enrich_proteins_from_uniprot([protein.id])

    mock_fetch.assert_not_called()
    assert count == 0
    assert had_error is False


@pytest.mark.django_db
def test_enrich_returns_zero_when_uniprot_has_no_data():
    from proteins.uniprot import enrich_proteins_from_uniprot

    protein = ProteinFactory(uniprot_id="P99999", protein_name=None)

    with patch("proteins.uniprot.fetch_uniprot_data", return_value={}):
        count, had_error = enrich_proteins_from_uniprot([protein.id])

    assert count == 0
    assert had_error is False


@pytest.mark.django_db
def test_enrich_returns_zero_on_api_error():
    from proteins.uniprot import enrich_proteins_from_uniprot
    import requests

    protein = ProteinFactory(uniprot_id="P12345", protein_name=None)

    with patch(
        "proteins.uniprot.fetch_uniprot_data",
        side_effect=requests.RequestException("timeout"),
    ):
        count, had_error = enrich_proteins_from_uniprot([protein.id])

    assert count == 0
    assert had_error is True


@pytest.mark.django_db
def test_enrich_fills_ensembl_id_and_entrez_id():
    from proteins.uniprot import enrich_proteins_from_uniprot

    protein = ProteinFactory(uniprot_id="P12345", ensembl_id=None, entrez_id=None)
    with patch(
        "proteins.uniprot.fetch_uniprot_data",
        return_value={"P12345": UNIPROT_ENTRY_WITH_XREFS},
    ):
        count, had_error = enrich_proteins_from_uniprot([protein.id])

    protein.refresh_from_db()
    assert count == 1
    assert had_error is False
    assert protein.ensembl_id == "ENSG00000139618"
    assert protein.entrez_id == "675"


@pytest.mark.django_db
def test_enrich_does_not_overwrite_existing_ensembl_entrez():
    from proteins.uniprot import enrich_proteins_from_uniprot

    protein = ProteinFactory(
        uniprot_id="P12345", ensembl_id="ENSG00000111111", entrez_id="999"
    )
    with patch(
        "proteins.uniprot.fetch_uniprot_data",
        return_value={"P12345": UNIPROT_ENTRY_WITH_XREFS},
    ):
        enrich_proteins_from_uniprot([protein.id])

    protein.refresh_from_db()
    assert protein.ensembl_id == "ENSG00000111111"
    assert protein.entrez_id == "999"
