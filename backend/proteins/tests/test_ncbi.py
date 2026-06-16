"""Tests for the NCBI taxonomy enrichment module."""

from unittest.mock import MagicMock, call, patch

import pytest

from proteins.tests.factories import OrganismFactory

NCBI_XML = """<?xml version="1.0"?>
<eSummaryResult>
  <DocSum>
    <Item Name="ScientificName" Type="String">Homo sapiens</Item>
  </DocSum>
</eSummaryResult>"""


# ── fetch_scientific_name ─────────────────────────────────────────────────────


def test_fetch_scientific_name_parses_xml():
    from proteins.ncbi import fetch_scientific_name

    mock_resp = MagicMock()
    mock_resp.text = NCBI_XML
    mock_resp.raise_for_status = MagicMock()

    with patch("proteins.ncbi.requests.get", return_value=mock_resp):
        result = fetch_scientific_name("9606")

    assert result == "Homo sapiens"


def test_fetch_scientific_name_returns_none_when_item_missing():
    from proteins.ncbi import fetch_scientific_name

    empty_xml = (
        '<?xml version="1.0"?><eSummaryResult><DocSum></DocSum></eSummaryResult>'
    )
    mock_resp = MagicMock()
    mock_resp.text = empty_xml
    mock_resp.raise_for_status = MagicMock()

    with patch("proteins.ncbi.requests.get", return_value=mock_resp):
        result = fetch_scientific_name("0")

    assert result is None


# ── enrich_organisms_from_ncbi ───────────────────────────────────────────────


@pytest.mark.django_db
def test_enrich_fills_scientific_name():
    from proteins.ncbi import enrich_organisms_from_ncbi

    org = OrganismFactory(taxonomy_id="9606", scientific_name=None)

    with patch(
        "proteins.ncbi.fetch_scientific_name", return_value="Homo sapiens"
    ), patch("proteins.ncbi.time.sleep"):
        count, had_error = enrich_organisms_from_ncbi([org.id])

    org.refresh_from_db()
    assert count == 1
    assert had_error is False
    assert org.scientific_name == "Homo sapiens"


@pytest.mark.django_db
def test_enrich_skips_organism_with_existing_scientific_name():
    from proteins.ncbi import enrich_organisms_from_ncbi

    org = OrganismFactory(taxonomy_id="9606", scientific_name="Homo sapiens")

    with patch("proteins.ncbi.fetch_scientific_name") as mock_fetch, patch(
        "proteins.ncbi.time.sleep"
    ):
        count, had_error = enrich_organisms_from_ncbi([org.id])

    mock_fetch.assert_not_called()
    assert count == 0
    assert had_error is False


@pytest.mark.django_db
def test_enrich_sleeps_between_requests():
    from proteins.ncbi import enrich_organisms_from_ncbi, NCBI_DELAY

    org1 = OrganismFactory(taxonomy_id="9606", scientific_name=None)
    org2 = OrganismFactory(taxonomy_id="10090", scientific_name=None)

    with patch("proteins.ncbi.fetch_scientific_name", return_value="Species"), patch(
        "proteins.ncbi.time.sleep"
    ) as mock_sleep:
        enrich_organisms_from_ncbi([org1.id, org2.id])

    # Sleep is called once between the two calls (not before the first)
    assert mock_sleep.call_count == 1
    assert mock_sleep.call_args == call(NCBI_DELAY)


@pytest.mark.django_db
def test_enrich_returns_had_error_true_on_api_failure():
    from proteins.ncbi import enrich_organisms_from_ncbi

    org = OrganismFactory(taxonomy_id="9606", scientific_name=None)

    with patch(
        "proteins.ncbi.fetch_scientific_name", side_effect=Exception("timeout")
    ), patch("proteins.ncbi.time.sleep"):
        count, had_error = enrich_organisms_from_ncbi([org.id])

    assert count == 0
    assert had_error is True
    org.refresh_from_db()
    assert org.scientific_name is None


@pytest.mark.django_db
def test_enrich_returns_zero_false_for_empty_list():
    from proteins.ncbi import enrich_organisms_from_ncbi

    count, had_error = enrich_organisms_from_ncbi([])
    assert count == 0
    assert had_error is False
