"""Tests for the Ensembl REST enrichment module."""

from unittest.mock import MagicMock, patch

import pytest

from proteins.tests.factories import ProteinFactory

ENSEMBL_XREFS_RESPONSE = [
    {"primary_id": "675", "display_id": "BRCA2", "dbname": "EntrezGene"},
    {"primary_id": "ENSG00000139618", "display_id": "BRCA2", "dbname": "Ensembl_gene"},
]


# ── fetch_gene_name_from_ensembl ──────────────────────────────────────────────


def test_fetch_gene_name_returns_display_id_of_first_result():
    from proteins.ensembl import fetch_gene_name_from_ensembl

    mock_resp = MagicMock()
    mock_resp.json.return_value = ENSEMBL_XREFS_RESPONSE
    mock_resp.raise_for_status = MagicMock()

    with patch("proteins.ensembl.requests.get", return_value=mock_resp):
        result = fetch_gene_name_from_ensembl("ENSG00000139618")

    assert result == "BRCA2"


def test_fetch_gene_name_returns_none_for_empty_response():
    from proteins.ensembl import fetch_gene_name_from_ensembl

    mock_resp = MagicMock()
    mock_resp.json.return_value = []
    mock_resp.raise_for_status = MagicMock()

    with patch("proteins.ensembl.requests.get", return_value=mock_resp):
        result = fetch_gene_name_from_ensembl("ENSG00000000000")

    assert result is None


# ── enrich_proteins_from_ensembl ─────────────────────────────────────────────


@pytest.mark.django_db
def test_enrich_ensembl_fills_gene_name_for_proteins_with_ensembl_id():
    from proteins.ensembl import enrich_proteins_from_ensembl

    protein = ProteinFactory(ensembl_id="ENSG00000139618", gene_name=None)

    with patch("proteins.ensembl.fetch_gene_name_from_ensembl", return_value="BRCA2"):
        count, had_error = enrich_proteins_from_ensembl([protein.id])

    protein.refresh_from_db()
    assert count == 1
    assert had_error is False
    assert protein.gene_name == "BRCA2"


@pytest.mark.django_db
def test_enrich_ensembl_skips_proteins_already_having_gene_name():
    from proteins.ensembl import enrich_proteins_from_ensembl

    protein = ProteinFactory(ensembl_id="ENSG00000139618", gene_name="BRCA2")

    with patch("proteins.ensembl.fetch_gene_name_from_ensembl") as mock_fetch:
        count, had_error = enrich_proteins_from_ensembl([protein.id])

    mock_fetch.assert_not_called()
    assert count == 0
    assert had_error is False


@pytest.mark.django_db
def test_enrich_ensembl_skips_proteins_without_ensembl_id():
    from proteins.ensembl import enrich_proteins_from_ensembl

    protein = ProteinFactory(ensembl_id=None, gene_name=None)

    with patch("proteins.ensembl.fetch_gene_name_from_ensembl") as mock_fetch:
        count, had_error = enrich_proteins_from_ensembl([protein.id])

    mock_fetch.assert_not_called()
    assert count == 0


@pytest.mark.django_db
def test_enrich_ensembl_returns_had_error_true_on_api_failure():
    from proteins.ensembl import enrich_proteins_from_ensembl

    protein = ProteinFactory(ensembl_id="ENSG00000139618", gene_name=None)

    with patch(
        "proteins.ensembl.fetch_gene_name_from_ensembl",
        side_effect=Exception("timeout"),
    ):
        count, had_error = enrich_proteins_from_ensembl([protein.id])

    assert count == 0
    assert had_error is True
    protein.refresh_from_db()
    assert protein.gene_name is None


@pytest.mark.django_db
def test_enrich_ensembl_returns_zero_false_for_empty_list():
    from proteins.ensembl import enrich_proteins_from_ensembl

    count, had_error = enrich_proteins_from_ensembl([])
    assert count == 0
    assert had_error is False
