"""
Parity tests: protein detail, settings, announcements, datasets, categories.

These endpoints have no JSON equivalent in the legacy PHP app (they were HTML
pages or admin-only forms), so parity is verified against:
  - The documented API contract (required fields, types, ordering)
  - Cross-checks against the 2.0 database directly (count / value consistency)
  - For protein detail: cross-checked against the search result for the same
    protein, which IS compared against legacy in test_search_parity.py.

Run with:
    pytest -m parity --no-header -q
"""

import pytest
from rest_framework.test import APIClient

from admin_panel.models import AdminSettings, Announcement
from datasets.models import Dataset
from interactions.models import InteractionCategory
from proteins.models import Protein

# ── Helpers ───────────────────────────────────────────────────────────────────


def _get(client: APIClient, path: str, params: dict | None = None) -> dict | list:
    resp = client.get(path, params or {})
    assert resp.status_code == 200, f"GET {path} returned {resp.status_code}"
    return resp.json()


def _skip_if_no_data(label: str, count: int) -> None:
    if count == 0:
        pytest.skip(f"No {label} in 2.0 DB — run data migration first")


# ── Protein detail ────────────────────────────────────────────────────────────

PROTEIN_DETAIL_REQUIRED_FIELDS = {
    "protein_id",
    "protein_gene_name",
    "protein_protein_name",
    "protein_uniprot_id",
    "protein_ensembl_id",
    "protein_entrez_id",
    "protein_description",
    "protein_sequence",
    "number_of_interactions_in_database",
    "annotation_array",
    "identifiers",
}

DETAIL_PROTEINS = ["BRCA1", "TP53", "BAD"]


@pytest.mark.parity
@pytest.mark.django_db
class TestProteinDetailParity:
    """Protein detail endpoint shape and data-consistency checks."""

    @pytest.fixture(autouse=True)
    def _setup(self):
        self.client = APIClient()

    @pytest.mark.parametrize("gene", DETAIL_PROTEINS)
    def test_response_shape(self, gene):
        _skip_if_no_data("proteins", Protein.objects.count())
        data = _get(self.client, f"/api/proteins/{gene}")
        missing = PROTEIN_DETAIL_REQUIRED_FIELDS - data.keys()
        assert not missing, f"GET /api/proteins/{gene} missing fields: {missing}"

    @pytest.mark.parametrize("gene", DETAIL_PROTEINS)
    def test_identifiers_list_is_non_empty(self, gene):
        _skip_if_no_data("proteins", Protein.objects.count())
        data = _get(self.client, f"/api/proteins/{gene}")
        assert data["identifiers"], f"{gene}: identifiers list is empty"
        for entry in data["identifiers"]:
            assert (
                "identifier" in entry and "naming_convention" in entry
            ), f"{gene}: identifier entry missing keys: {entry}"

    @pytest.mark.parametrize("gene", DETAIL_PROTEINS)
    def test_gene_name_matches_query(self, gene):
        """Protein returned must actually be the requested gene."""
        _skip_if_no_data("proteins", Protein.objects.count())
        data = _get(self.client, f"/api/proteins/{gene}")
        assert (
            data["protein_gene_name"] == gene
        ), f"Expected gene_name={gene!r}, got {data['protein_gene_name']!r}"

    @pytest.mark.parametrize("gene", DETAIL_PROTEINS)
    def test_interaction_count_is_non_negative(self, gene):
        _skip_if_no_data("proteins", Protein.objects.count())
        data = _get(self.client, f"/api/proteins/{gene}")
        assert isinstance(data["number_of_interactions_in_database"], int)
        assert data["number_of_interactions_in_database"] >= 0

    @pytest.mark.parametrize("gene", DETAIL_PROTEINS)
    def test_detail_consistent_with_search_result(self, gene):
        """
        The protein fields returned by the detail endpoint must match those
        embedded in the search result for the same gene.  search_parity tests
        already confirm the search result matches legacy, so this transitively
        verifies detail parity.
        """
        _skip_if_no_data("proteins", Protein.objects.count())
        detail = _get(self.client, f"/api/proteins/{gene}")
        search = _get(self.client, "/api/search", {"q": gene, "filter": "None"})

        proteins_in_search = {
            p["protein_gene_name"]: p for p in search.get("all_proteins", [])
        }
        assert (
            gene in proteins_in_search
        ), f"{gene} not found in search result — data migration may be incomplete"
        sp = proteins_in_search[gene]

        for field in (
            "protein_id",
            "protein_uniprot_id",
            "protein_ensembl_id",
            "protein_entrez_id",
            "protein_description",
        ):
            assert (
                detail[field] == sp[field]
            ), f"{gene}.{field}: detail={detail[field]!r} vs search={sp[field]!r}"

    def test_unknown_identifier_returns_404(self):
        resp = self.client.get("/api/proteins/NOTAPROTEIN_XYZ999")
        assert (
            resp.status_code == 404
        ), f"Expected 404 for unknown protein, got {resp.status_code}"

    def test_uniprot_id_resolves_same_as_gene_name(self):
        """GET /api/proteins/<uniprot_id> must return the same protein as the gene name."""
        _skip_if_no_data("proteins", Protein.objects.count())
        brca1 = _get(self.client, "/api/proteins/BRCA1")
        uniprot_id = brca1.get("protein_uniprot_id")
        if not uniprot_id:
            pytest.skip("BRCA1 has no UniProt ID in this DB")
        by_uniprot = _get(self.client, f"/api/proteins/{uniprot_id}")
        assert by_uniprot["protein_id"] == brca1["protein_id"], (
            f"UniProt lookup returned protein {by_uniprot['protein_id']} "
            f"instead of {brca1['protein_id']}"
        )


# ── Admin settings ────────────────────────────────────────────────────────────

SETTINGS_REQUIRED_FIELDS = {
    "title",
    "shortTitle",
    "footer",
    "homePage",
    "missionTitle",
    "missionText",
    "methodTitle",
    "methodText",
    "mainColorScheme",
    "headerColorScheme",
    "logoColorScheme",
    "buttonColorScheme",
    "queryNodeColor",
    "interactorNodeColor",
    "publishedEdgeColor",
    "validatedEdgeColor",
    "verifiedEdgeColor",
    "literatureEdgeColor",
    "url",
    "version",
    "logoUrl",
    "navStyle",
    "mainColorScheme2",
    "gradientAngle",
}

NODE_EDGE_COLOR_FIELDS = {
    "queryNodeColor",
    "interactorNodeColor",
    "publishedEdgeColor",
    "validatedEdgeColor",
    "verifiedEdgeColor",
    "literatureEdgeColor",
}


@pytest.mark.parity
@pytest.mark.django_db
class TestSettingsParity:
    """Admin settings endpoint shape and value checks."""

    @pytest.fixture(autouse=True)
    def _setup(self):
        self.client = APIClient()

    def test_all_required_fields_present(self):
        data = _get(self.client, "/api/settings")
        missing = SETTINGS_REQUIRED_FIELDS - data.keys()
        assert not missing, f"GET /api/settings missing fields: {missing}"

    def test_no_extra_required_fields_are_null(self):
        """Node and edge color fields must never be null — the graph depends on them."""
        data = _get(self.client, "/api/settings")
        null_colors = {f for f in NODE_EDGE_COLOR_FIELDS if data.get(f) is None}
        assert not null_colors, f"Color fields are null: {null_colors}"

    def test_color_fields_are_hex_strings(self):
        import re

        data = _get(self.client, "/api/settings")
        hex_re = re.compile(r"^#[0-9a-fA-F]{3,8}$")
        bad = {
            f: data[f]
            for f in NODE_EDGE_COLOR_FIELDS
            if not hex_re.match(data.get(f, ""))
        }
        assert not bad, f"Color fields are not valid hex: {bad}"

    def test_title_is_non_empty_string(self):
        data = _get(self.client, "/api/settings")
        assert (
            isinstance(data["title"], str) and data["title"].strip()
        ), "settings.title must be a non-empty string"

    def test_settings_count_in_db_is_one(self):
        """There must be exactly one AdminSettings row."""
        assert (
            AdminSettings.objects.count() == 1
        ), f"Expected 1 AdminSettings row, found {AdminSettings.objects.count()}"

    def test_patch_persists_and_restores(self):
        """PATCH /api/settings changes a field; verify it persists; restore original."""
        from django.contrib.auth import get_user_model

        User = get_user_model()
        admin = User.objects.filter(is_staff=True).first()
        if not admin:
            pytest.skip("No staff user in DB")
        self.client.force_authenticate(user=admin)

        original = _get(self.client, "/api/settings")
        original_title = original["title"]
        new_title = original_title + " (parity-test)"

        patch_resp = self.client.patch(
            "/api/settings", {"title": new_title}, format="json"
        )
        assert patch_resp.status_code == 200, f"PATCH failed: {patch_resp.status_code}"
        assert patch_resp.json()["title"] == new_title

        # Verify persistence
        assert _get(self.client, "/api/settings")["title"] == new_title

        # Restore
        restore = self.client.patch(
            "/api/settings", {"title": original_title}, format="json"
        )
        assert restore.status_code == 200
        assert _get(self.client, "/api/settings")["title"] == original_title


# ── Announcements ─────────────────────────────────────────────────────────────

ANNOUNCEMENT_REQUIRED_FIELDS = {"id", "title", "text", "date", "show", "showOnHomePage"}


@pytest.mark.parity
@pytest.mark.django_db
class TestAnnouncementsParity:
    """Announcements endpoint shape and DB-consistency checks."""

    @pytest.fixture(autouse=True)
    def _setup(self):
        self.client = APIClient()

    def test_response_is_list(self):
        data = _get(self.client, "/api/announcements")
        assert isinstance(data, list), f"Expected list, got {type(data)}"

    def test_count_matches_db(self):
        data = _get(self.client, "/api/announcements")
        db_count = Announcement.objects.filter(show=True).count()
        assert (
            len(data) == db_count
        ), f"API returned {len(data)} announcements, DB has {db_count} visible"

    def test_required_fields_present(self):
        data = _get(self.client, "/api/announcements")
        if not data:
            pytest.skip("No announcements in DB")
        for item in data:
            missing = ANNOUNCEMENT_REQUIRED_FIELDS - item.keys()
            assert not missing, f"Announcement missing fields: {missing}"

    def test_only_visible_announcements_returned(self):
        """Public endpoint must only return show=True announcements."""
        data = _get(self.client, "/api/announcements")
        for item in data:
            assert (
                item["show"] is True
            ), f"Announcement id={item['id']} has show=False but was returned"

    def test_ordered_most_recent_first(self):
        data = _get(self.client, "/api/announcements")
        if len(data) < 2:
            pytest.skip("Need at least 2 announcements to test ordering")
        dates = [item["date"] for item in data]
        assert dates == sorted(
            dates, reverse=True
        ), f"Announcements not ordered most-recent first: {dates}"


# ── Datasets ──────────────────────────────────────────────────────────────────

DATASET_REQUIRED_FIELDS = {
    "id",
    "name",
    "dataset_reference",
    "dataset_author",
    "year",
    "description",
    "interaction_status",
}

KNOWN_DATASETS = ["HI-I-05", "HuRI", "Lit-BM"]


@pytest.mark.parity
@pytest.mark.django_db
class TestDatasetsParity:
    """Datasets endpoint shape and DB-consistency checks."""

    @pytest.fixture(autouse=True)
    def _setup(self):
        self.client = APIClient()

    def test_response_is_list(self):
        data = _get(self.client, "/api/datasets")
        assert isinstance(data, list), f"Expected list, got {type(data)}"

    def test_count_matches_db(self):
        data = _get(self.client, "/api/datasets")
        db_count = Dataset.objects.count()
        _skip_if_no_data("datasets", db_count)
        assert (
            len(data) == db_count
        ), f"API returned {len(data)} datasets, DB has {db_count}"

    def test_required_fields_present(self):
        data = _get(self.client, "/api/datasets")
        _skip_if_no_data("datasets", len(data))
        for item in data:
            missing = DATASET_REQUIRED_FIELDS - item.keys()
            assert (
                not missing
            ), f"Dataset missing fields: {missing} in {item.get('name')}"

    @pytest.mark.parametrize("name", KNOWN_DATASETS)
    def test_known_dataset_present(self, name):
        """Canonical HuRI datasets that must exist after migration."""
        data = _get(self.client, "/api/datasets")
        _skip_if_no_data("datasets", len(data))
        names = {d["name"] for d in data}
        assert name in names, (
            f"Expected dataset '{name}' not found in API response. "
            f"Available: {sorted(names)}"
        )

    def test_no_dataset_has_null_name(self):
        data = _get(self.client, "/api/datasets")
        null_names = [d for d in data if not d.get("name")]
        assert not null_names, f"Datasets with null/empty name: {null_names}"


# ── Interaction categories ────────────────────────────────────────────────────

EXPECTED_CATEGORIES = [
    {"category_name": "Published", "order": "1"},
    {"category_name": "Validated", "order": "2"},
    {"category_name": "Verified", "order": "3"},
    {"category_name": "Literature", "order": "4"},
]


@pytest.mark.parity
@pytest.mark.django_db
class TestInteractionCategoriesParity:
    """Interaction categories endpoint — exact values must match legacy DB."""

    @pytest.fixture(autouse=True)
    def _setup(self):
        self.client = APIClient()

    def test_response_is_list(self):
        data = _get(self.client, "/api/interactions/categories")
        assert isinstance(data, list)

    def test_exactly_four_categories(self):
        data = _get(self.client, "/api/interactions/categories")
        assert len(data) == 4, (
            f"Expected 4 interaction categories, got {len(data)}: "
            f"{[c['category_name'] for c in data]}"
        )

    def test_required_fields_present(self):
        data = _get(self.client, "/api/interactions/categories")
        for item in data:
            assert {
                "id",
                "category_name",
                "order",
            } <= item.keys(), f"Category missing fields: {item}"

    def test_category_names_and_order_match_legacy(self):
        """Names and order values must exactly match the legacy DB."""
        data = _get(self.client, "/api/interactions/categories")
        actual = [
            {"category_name": c["category_name"], "order": c["order"]} for c in data
        ]
        assert (
            actual == EXPECTED_CATEGORIES
        ), f"Category mismatch:\n  expected: {EXPECTED_CATEGORIES}\n  got:      {actual}"

    def test_ordered_by_order_field(self):
        data = _get(self.client, "/api/interactions/categories")
        orders = [c["order"] for c in data]
        assert orders == sorted(
            orders
        ), f"Categories not sorted by order field: {orders}"

    def test_count_matches_db(self):
        data = _get(self.client, "/api/interactions/categories")
        db_count = InteractionCategory.objects.count()
        assert (
            len(data) == db_count
        ), f"API returned {len(data)} categories, DB has {db_count}"
