import io
from unittest.mock import patch

import pytest

from datasets.citation_lookup import (
    CitationLookupError,
    fetch_by_doi,
    fetch_by_pubmed_id,
)
from datasets.models import Dataset
from datasets.serializers import format_citation

PSI_MI_CONTENT = b"""#id_A\tid_B
uniprotkb:Q92934\tuniprotkb:Q07817
"""


# ── PATCH: editing datasets that are already loaded ──────────────────────────


@pytest.mark.django_db
def test_patch_requires_admin(user_auth_client):
    ds = Dataset.objects.create(name="HI-III")
    response = user_auth_client.patch(
        f"/api/datasets/{ds.id}", {"title": "Nope"}, format="json"
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_patch_sets_citation_on_existing_dataset(auth_client):
    ds = Dataset.objects.create(name="HI-II-14", interaction_status="published")

    response = auth_client.patch(
        f"/api/datasets/{ds.id}",
        {
            "pubmed_id": "25416956",
            "author": "Rolland et al.",
            "year": "2014",
            "title": "A proteome-scale map of the human interactome network",
            "journal": "Cell",
            "doi": "10.1016/j.cell.2014.10.050",
            "publication_status": "published",
        },
        format="json",
    )

    assert response.status_code == 200
    ds.refresh_from_db()
    assert ds.title == "A proteome-scale map of the human interactome network"
    assert ds.journal == "Cell"
    assert ds.publication_status == "published"
    assert response.data["citation"] == (
        "Rolland et al. (2014). A proteome-scale map of the human "
        "interactome network. Cell."
    )


@pytest.mark.django_db
def test_patch_sets_about_paragraph_on_existing_dataset(auth_client):
    ds = Dataset.objects.create(name="HI-III")

    response = auth_client.patch(
        f"/api/datasets/{ds.id}",
        {
            "about_heading": "HI-III",
            "about_body": "Screens of space III, provided for search and download.",
            "about_order": 3,
        },
        format="json",
    )

    assert response.status_code == 200
    ds.refresh_from_db()
    assert ds.about_heading == "HI-III"
    assert ds.about_body.startswith("Screens of space III")
    assert ds.about_order == 3
    assert ds.show_on_about is True


@pytest.mark.django_db
def test_patch_cannot_rename_or_recount_dataset(auth_client):
    ds = Dataset.objects.create(name="HI-III", number_of_interactions="48070")

    response = auth_client.patch(
        f"/api/datasets/{ds.id}",
        {"name": "Renamed", "number_of_interactions": "1", "title": "Real edit"},
        format="json",
    )

    assert response.status_code == 200
    ds.refresh_from_db()
    assert ds.name == "HI-III"
    assert ds.number_of_interactions == "48070"
    assert ds.title == "Real edit"


@pytest.mark.django_db
def test_patch_missing_dataset_is_404(auth_client):
    response = auth_client.patch("/api/datasets/99999", {"title": "x"}, format="json")
    assert response.status_code == 404


# ── Validation ───────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_patch_rejects_non_numeric_pubmed_id(auth_client):
    """Legacy shipped pubmed_id='HI-III', which exports rendered as pubmed:HI-III."""
    ds = Dataset.objects.create(name="HI-III")

    response = auth_client.patch(
        f"/api/datasets/{ds.id}", {"pubmed_id": "HI-III"}, format="json"
    )

    assert response.status_code == 400
    assert "digits only" in str(response.data["pubmed_id"][0])


@pytest.mark.django_db
def test_patch_rejects_malformed_year_and_doi(auth_client):
    ds = Dataset.objects.create(name="X")

    assert (
        auth_client.patch(
            f"/api/datasets/{ds.id}", {"year": "14"}, format="json"
        ).status_code
        == 400
    )
    assert (
        auth_client.patch(
            f"/api/datasets/{ds.id}", {"doi": "not-a-doi"}, format="json"
        ).status_code
        == 400
    )


@pytest.mark.django_db
def test_patch_normalises_pasted_doi_url(auth_client):
    ds = Dataset.objects.create(name="X")

    response = auth_client.patch(
        f"/api/datasets/{ds.id}",
        {"doi": "https://doi.org/10.1038/s41586-020-2188-x"},
        format="json",
    )

    assert response.status_code == 200
    ds.refresh_from_db()
    assert ds.doi == "10.1038/s41586-020-2188-x"


@pytest.mark.django_db
def test_patch_can_clear_a_wrong_citation(auth_client):
    """Blanking a field must null it out, not be rejected as an empty string."""
    ds = Dataset.objects.create(
        name="HI-III", pubmed_id="12345", author="Wrong et al.", year="1999"
    )

    response = auth_client.patch(
        f"/api/datasets/{ds.id}",
        {"pubmed_id": "", "author": "", "year": "", "title": "", "url": ""},
        format="json",
    )

    assert response.status_code == 200
    ds.refresh_from_db()
    assert ds.pubmed_id is None
    assert ds.author is None
    assert ds.year is None
    assert response.data["citation"] is None
    assert response.data["dataset_author"] == "Unpublished Dataset"


# ── Citation formatting ──────────────────────────────────────────────────────


@pytest.mark.django_db
def test_format_citation_handles_partial_and_empty_records():
    assert format_citation(Dataset(name="Unpublished")) is None
    assert (
        format_citation(Dataset(author="Yu et al.", year="2011")) == "Yu et al. (2011)."
    )
    assert (
        format_citation(Dataset(author="Yang et al.", year="2016", journal="Cell"))
        == "Yang et al. (2016). Cell."
    )


# ── Lookup ───────────────────────────────────────────────────────────────────


def _pubmed_payload():
    return {
        "result": {
            "25416956": {
                "title": "A proteome-scale map of the human interactome network.",
                "fulljournalname": "Cell",
                "pubdate": "2014 Nov 20",
                "authors": [{"name": "Rolland T"}, {"name": "Tasan M"}],
                "articleids": [
                    {"idtype": "doi", "value": "10.1016/j.cell.2014.10.050"}
                ],
            }
        }
    }


def test_fetch_by_pubmed_id_maps_fields():
    resp = type(
        "R",
        (),
        {"json": lambda self: _pubmed_payload(), "raise_for_status": lambda self: None},
    )()
    with patch("datasets.citation_lookup.requests.get", return_value=resp):
        result = fetch_by_pubmed_id("25416956")

    assert result["title"] == "A proteome-scale map of the human interactome network"
    assert result["journal"] == "Cell"
    assert result["year"] == "2014"
    assert result["author"] == "Rolland T et al."
    assert result["doi"] == "10.1016/j.cell.2014.10.050"


def test_fetch_by_pubmed_id_raises_on_unknown_id():
    resp = type(
        "R",
        (),
        {"json": lambda self: {"result": {}}, "raise_for_status": lambda self: None},
    )()
    with patch("datasets.citation_lookup.requests.get", return_value=resp):
        with pytest.raises(CitationLookupError, match="No PubMed record"):
            fetch_by_pubmed_id("999999999")


def test_fetch_by_doi_maps_crossref_shape():
    payload = {
        "message": {
            "DOI": "10.1038/s41586-020-2188-x",
            "title": ["A reference map of the human binary protein interactome"],
            "container-title": ["Nature"],
            "published": {"date-parts": [[2020, 4, 8]]},
            "author": [{"family": "Luck"}, {"family": "Kim"}],
            "URL": "https://doi.org/10.1038/s41586-020-2188-x",
        }
    }
    resp = type(
        "R",
        (),
        {
            "json": lambda self: payload,
            "raise_for_status": lambda self: None,
            "status_code": 200,
        },
    )()
    with patch("datasets.citation_lookup.requests.get", return_value=resp):
        result = fetch_by_doi("10.1038/s41586-020-2188-x")

    assert result["journal"] == "Nature"
    assert result["year"] == "2020"
    assert result["author"] == "Luck et al."


@pytest.mark.django_db
def test_citation_lookup_endpoint_requires_admin(user_auth_client):
    response = user_auth_client.get("/api/datasets/citation-lookup?pubmed_id=25416956")
    assert response.status_code == 403


@pytest.mark.django_db
def test_citation_lookup_endpoint_validates_input(auth_client):
    assert auth_client.get("/api/datasets/citation-lookup").status_code == 400
    assert (
        auth_client.get("/api/datasets/citation-lookup?pubmed_id=abc").status_code
        == 400
    )


@pytest.mark.django_db
def test_citation_lookup_endpoint_returns_metadata(auth_client):
    resp = type(
        "R",
        (),
        {"json": lambda self: _pubmed_payload(), "raise_for_status": lambda self: None},
    )()
    with patch("datasets.citation_lookup.requests.get", return_value=resp):
        response = auth_client.get("/api/datasets/citation-lookup?pubmed_id=25416956")

    assert response.status_code == 200
    assert response.data["journal"] == "Cell"


@pytest.mark.django_db
def test_citation_lookup_endpoint_reports_upstream_failure(auth_client):
    # Patch where the view looked it up, not where it was defined — views.py
    # imports the function by name, so it holds its own reference.
    with patch(
        "datasets.views.fetch_by_pubmed_id",
        side_effect=CitationLookupError("PubMed is unavailable right now."),
    ):
        response = auth_client.get("/api/datasets/citation-lookup?pubmed_id=25416956")

    assert response.status_code == 502


# ── Upload capture ───────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_upload_stores_citation_metadata(auth_client):
    f = io.BytesIO(PSI_MI_CONTENT)
    f.name = "test.tab"

    response = auth_client.post(
        "/api/datasets/upload",
        {
            "file": f,
            "dataset_name": "New-Screen-26",
            "interaction_status": "published",
            "pubmed_id": "25416956",
            "author": "Rolland et al.",
            "year": "2014",
            "about_body": "A paragraph written at upload time.",
        },
        format="multipart",
    )

    assert response.status_code == 201
    ds = Dataset.objects.get(name="New-Screen-26")
    assert ds.pubmed_id == "25416956"
    assert ds.author == "Rolland et al."
    assert ds.about_body == "A paragraph written at upload time."


@pytest.mark.django_db
def test_upload_rejects_bad_citation_metadata(auth_client):
    f = io.BytesIO(PSI_MI_CONTENT)
    f.name = "test.tab"

    response = auth_client.post(
        "/api/datasets/upload",
        {"file": f, "dataset_name": "Bad-Cite", "pubmed_id": "not-a-pmid"},
        format="multipart",
    )

    assert response.status_code == 400


@pytest.mark.django_db
def test_upload_without_citation_still_works(auth_client):
    f = io.BytesIO(PSI_MI_CONTENT)
    f.name = "test.tab"

    response = auth_client.post(
        "/api/datasets/upload",
        {"file": f, "dataset_name": "No-Cite"},
        format="multipart",
    )

    assert response.status_code == 201
    ds = Dataset.objects.get(name="No-Cite")
    assert ds.pubmed_id is None
    assert ds.publication_status == "unpublished"


# ── Export headers ───────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_tab_export_carries_a_citation_header(client):
    ds = Dataset.objects.create(
        name="HI-II-14",
        pubmed_id="25416956",
        author="Rolland et al.",
        year="2014",
        journal="Cell",
    )

    response = client.get(f"/api/datasets/{ds.id}/download?fmt=tab")
    body = b"".join(response.streaming_content).decode()

    assert "# openPIP dataset: HI-II-14" in body
    assert "# Please cite: Rolland et al. (2014). Cell." in body
    assert "https://pubmed.ncbi.nlm.nih.gov/25416956/" in body
    # Every citation line must stay a comment so the file re-imports cleanly.
    assert all(line.startswith("#") for line in body.splitlines()[:4] if line.strip())


@pytest.mark.django_db
def test_tab_export_header_names_unpublished_datasets_too(client):
    ds = Dataset.objects.create(name="Test-Space")

    response = client.get(f"/api/datasets/{ds.id}/download?fmt=tab")
    body = b"".join(response.streaming_content).decode()

    assert "# openPIP dataset: Test-Space" in body
    assert "Unpublished dataset" in body
