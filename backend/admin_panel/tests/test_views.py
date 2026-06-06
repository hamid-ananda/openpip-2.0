import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from admin_panel.models import AdminSettings, Announcement


@pytest.mark.django_db
def test_get_settings_returns_camel_case(api_client):
    AdminSettings.objects.create(
        pk=1,
        title="My Portal",
        short_title="MP",
        main_color_scheme="#ff0000",
        header_color_scheme="#ffffff",
        logo_color_scheme="#000000",
        button_color_scheme="#ff0000",
        query_node_color="#ff0000",
        interactor_node_color="#0000ff",
        published_edge_color="#00ff00",
        validated_edge_color="#0000ff",
        verified_edge_color="#ff0000",
        literature_edge_color="#ff9900",
        url="http://localhost",
        version="2.0",
    )
    response = api_client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "My Portal"
    assert data["shortTitle"] == "MP"
    assert data["mainColorScheme"] == "#ff0000"
    assert "main_color_scheme" not in data


@pytest.mark.django_db
def test_patch_settings_requires_admin(api_client, user_auth_client):
    AdminSettings.objects.create(pk=1, title="Old Title")
    response = user_auth_client.patch(
        "/api/settings", {"title": "New Title"}, format="json"
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_patch_settings_as_admin(auth_client):
    AdminSettings.objects.create(pk=1, title="Old Title")
    response = auth_client.patch("/api/settings", {"title": "New Title"}, format="json")
    assert response.status_code == 200
    assert response.json()["title"] == "New Title"


@pytest.mark.django_db
def test_get_announcements_returns_home_page_announcements(api_client):
    Announcement.objects.create(title="Shown", text="Hello", show_on_home_page=True)
    Announcement.objects.create(title="Hidden", text="World", show_on_home_page=False)
    response = api_client.get("/api/announcements")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Shown"
    assert "showOnHomePage" in data[0]


# ── Admin announcement endpoint tests ──────────────────────────────────────


@pytest.mark.django_db
def test_admin_list_announcements_returns_all(auth_client):
    """Admin GET /api/admin/announcements returns all announcements regardless of show/show_on_home_page."""
    Announcement.objects.create(
        title="Visible", text="v", show=True, show_on_home_page=True
    )
    Announcement.objects.create(
        title="Hidden", text="h", show=False, show_on_home_page=False
    )
    response = auth_client.get("/api/admin/announcements")
    assert response.status_code == 200
    data = response.json()
    titles = {a["title"] for a in data}
    assert titles == {"Visible", "Hidden"}
    # show field is present
    assert "show" in data[0]


@pytest.mark.django_db
def test_admin_list_announcements_blocked_for_non_admin(user_auth_client):
    """Regular user cannot access admin announcement list."""
    response = user_auth_client.get("/api/admin/announcements")
    assert response.status_code == 403


@pytest.mark.django_db
def test_admin_list_announcements_blocked_for_anonymous(api_client):
    """Unauthenticated request is rejected."""
    response = api_client.get("/api/admin/announcements")
    assert response.status_code in (401, 403)


@pytest.mark.django_db
def test_admin_create_announcement(auth_client):
    """Admin can create an announcement."""
    payload = {
        "title": "New Release",
        "text": "<p>Version 2.0 is live.</p>",
        "date": timezone.now().isoformat(),
        "show": True,
        "showOnHomePage": True,
    }
    response = auth_client.post("/api/admin/announcements", payload, format="json")
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New Release"
    assert data["show"] is True
    assert Announcement.objects.count() == 1


@pytest.mark.django_db
def test_admin_create_announcement_requires_title(auth_client):
    """Creating an announcement without a title returns 400."""
    payload = {"text": "No title here", "show": True, "showOnHomePage": False}
    response = auth_client.post("/api/admin/announcements", payload, format="json")
    assert response.status_code == 400


@pytest.mark.django_db
def test_admin_create_announcement_requires_text(auth_client):
    """Creating an announcement without text returns 400."""
    payload = {"title": "No text", "show": True, "showOnHomePage": False}
    response = auth_client.post("/api/admin/announcements", payload, format="json")
    assert response.status_code == 400


@pytest.mark.django_db
def test_admin_create_blocked_for_non_admin(user_auth_client):
    """Regular user cannot create an announcement."""
    payload = {"title": "Bad", "text": "Actor", "show": True, "showOnHomePage": False}
    response = user_auth_client.post("/api/admin/announcements", payload, format="json")
    assert response.status_code == 403


@pytest.mark.django_db
def test_admin_patch_announcement_soft_delete(auth_client):
    """PATCH show=False hides an announcement (soft delete)."""
    ann = Announcement.objects.create(title="Live", text="content", show=True)
    response = auth_client.patch(
        f"/api/admin/announcements/{ann.pk}", {"show": False}, format="json"
    )
    assert response.status_code == 200
    ann.refresh_from_db()
    assert ann.show is False


@pytest.mark.django_db
def test_admin_patch_announcement_restore(auth_client):
    """PATCH show=True restores a hidden announcement."""
    ann = Announcement.objects.create(title="Old", text="content", show=False)
    response = auth_client.patch(
        f"/api/admin/announcements/{ann.pk}", {"show": True}, format="json"
    )
    assert response.status_code == 200
    ann.refresh_from_db()
    assert ann.show is True


@pytest.mark.django_db
def test_admin_patch_blocked_for_non_admin(user_auth_client):
    """Regular user cannot patch an announcement."""
    ann = Announcement.objects.create(title="X", text="y", show=True)
    response = user_auth_client.patch(
        f"/api/admin/announcements/{ann.pk}", {"show": False}, format="json"
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_admin_patch_nonexistent_returns_404(auth_client):
    """PATCH on a non-existent announcement returns 404."""
    response = auth_client.patch(
        "/api/admin/announcements/99999", {"show": False}, format="json"
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_admin_hard_delete_announcement(auth_client):
    """DELETE permanently removes an announcement."""
    ann = Announcement.objects.create(title="Gone", text="bye", show=False)
    response = auth_client.delete(f"/api/admin/announcements/{ann.pk}")
    assert response.status_code == 204
    assert not Announcement.objects.filter(pk=ann.pk).exists()


@pytest.mark.django_db
def test_admin_hard_delete_blocked_for_non_admin(user_auth_client):
    """Regular user cannot hard-delete an announcement."""
    ann = Announcement.objects.create(title="Safe", text="text", show=False)
    response = user_auth_client.delete(f"/api/admin/announcements/{ann.pk}")
    assert response.status_code == 403


@pytest.mark.django_db
def test_admin_hard_delete_nonexistent_returns_404(auth_client):
    """DELETE on a non-existent announcement returns 404."""
    response = auth_client.delete("/api/admin/announcements/99999")
    assert response.status_code == 404


@pytest.mark.django_db
def test_admin_list_ordered_by_date_desc(auth_client):
    """Admin list returns announcements newest-first."""
    a1 = Announcement.objects.create(
        title="Old", text="old", date="2024-01-01T00:00:00Z"
    )
    a2 = Announcement.objects.create(
        title="New", text="new", date="2025-06-01T00:00:00Z"
    )
    response = auth_client.get("/api/admin/announcements")
    assert response.status_code == 200
    data = response.json()
    assert data[0]["title"] == a2.title
    assert data[1]["title"] == a1.title


# ── End admin announcement endpoint tests ──────────────────────────────────


@pytest.mark.django_db
def test_get_counts(api_client):
    from proteins.models import Protein
    from interactions.models import Interaction

    p1 = Protein.objects.create(gene_name="A")
    p2 = Protein.objects.create(gene_name="B")
    Interaction.objects.create(interactor_A=p1, interactor_B=p2, removed="0")
    Interaction.objects.create(interactor_A=p1, interactor_B=p2, removed="1")
    response = api_client.get("/api/counts")
    assert response.status_code == 200
    data = response.json()
    assert data["proteins"] == 2
    assert data["interactions"] == 1


@pytest.mark.django_db
def test_get_counts_includes_datasets_key(api_client):
    from datasets.models import Dataset

    Dataset.objects.create(name="HuRI", pubmed_id="12345")
    response = api_client.get("/api/counts")
    assert response.status_code == 200
    data = response.json()
    assert "datasets" in data
    assert data["datasets"] == 1


@pytest.mark.django_db
def test_get_settings_returns_empty_dict_when_unseeded(api_client):
    response = api_client.get("/api/settings")
    assert response.status_code == 200
    assert response.json() == {}


@pytest.mark.django_db
def test_patch_settings_unauthenticated_returns_401(api_client):
    AdminSettings.objects.create(pk=1, title="T")
    response = api_client.patch("/api/settings", {"title": "X"}, format="json")
    assert response.status_code in (401, 403)


# ── Logo upload ────────────────────────────────────────────────────────────


def _png_file(name="logo.png"):
    # Minimal 1×1 PNG bytes
    data = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
        b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00"
        b"\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18"
        b"\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    return SimpleUploadedFile(name, data, content_type="image/png")


@pytest.mark.django_db
def test_logo_upload_valid_png(auth_client):
    AdminSettings.objects.create(pk=1, title="T")
    response = auth_client.post(
        "/api/settings/logo", {"logo": _png_file()}, format="multipart"
    )
    assert response.status_code == 200
    assert response.json().get("logoUrl") is not None


@pytest.mark.django_db
def test_logo_upload_invalid_type_returns_400(auth_client):
    AdminSettings.objects.create(pk=1, title="T")
    bad_file = SimpleUploadedFile("doc.txt", b"hello", content_type="text/plain")
    response = auth_client.post(
        "/api/settings/logo", {"logo": bad_file}, format="multipart"
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_logo_upload_requires_admin(user_auth_client):
    AdminSettings.objects.create(pk=1, title="T")
    response = user_auth_client.post(
        "/api/settings/logo", {"logo": _png_file()}, format="multipart"
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_logo_upload_no_file_returns_400(auth_client):
    AdminSettings.objects.create(pk=1, title="T")
    response = auth_client.post("/api/settings/logo", {}, format="multipart")
    assert response.status_code == 400


@pytest.mark.django_db
def test_logo_delete_removes_logo(auth_client):
    settings = AdminSettings.objects.create(pk=1, title="T")
    # upload first
    auth_client.post("/api/settings/logo", {"logo": _png_file()}, format="multipart")
    response = auth_client.delete("/api/settings/logo")
    assert response.status_code == 200
    settings.refresh_from_db()
    assert not settings.logo


@pytest.mark.django_db
def test_logo_delete_requires_admin(user_auth_client):
    AdminSettings.objects.create(pk=1, title="T")
    response = user_auth_client.delete("/api/settings/logo")
    assert response.status_code == 403


# ── New AdminSettings field tests ─────────────────────────────────────────


@pytest.mark.django_db
def test_get_settings_exposes_about_and_content_fields(api_client):
    AdminSettings.objects.create(
        pk=1,
        about="<p>About text</p>",
        faq="<p>FAQ text</p>",
        contact="<p>Contact text</p>",
        download="<p>Download text</p>",
        show_downloads=True,
        show_download_all=False,
    )
    response = api_client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert data["about"] == "<p>About text</p>"
    assert data["faq"] == "<p>FAQ text</p>"
    assert data["contact"] == "<p>Contact text</p>"
    assert data["download"] == "<p>Download text</p>"
    assert data["showDownloads"] is True
    assert data["showDownloadAll"] is False


@pytest.mark.django_db
def test_get_settings_exposes_example_fields(api_client):
    AdminSettings.objects.create(
        pk=1,
        example_1="BAD\nBAK1\nMCL1",
        example_1_type="query-query",
        example_2="BAD\nBAK1",
        example_2_type="query-interactor",
        example_3="BAD",
        example_3_type="all",
    )
    response = api_client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert data["example1"] == "BAD\nBAK1\nMCL1"
    assert data["example1Type"] == "query-query"
    assert data["example2Type"] == "query-interactor"
    assert data["example3Type"] == "all"


@pytest.mark.django_db
def test_patch_settings_updates_example_type(auth_client):
    AdminSettings.objects.create(pk=1)
    response = auth_client.patch(
        "/api/settings",
        {"example1": "BAD\nBAK1", "example1Type": "query-query"},
        format="json",
    )
    assert response.status_code == 200
    data = response.json()
    assert data["example1"] == "BAD\nBAK1"
    assert data["example1Type"] == "query-query"


# ── InteractionCategory endpoint tests ────────────────────────────────────


@pytest.mark.django_db
def test_list_interaction_categories_is_public(api_client):
    from interactions.models import InteractionCategory

    settings_obj, _ = AdminSettings.objects.get_or_create(pk=1)
    InteractionCategory.objects.create(
        admin_settings=settings_obj,
        category_name="Literature",
        order="1",
        color_scheme="#0ea5e9",
        description="Curated literature interactions",
    )
    response = api_client.get("/api/interaction-categories")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    lit = next(d for d in data if d["categoryName"] == "Literature")
    assert lit["colorScheme"] == "#0ea5e9"


@pytest.mark.django_db
def test_create_interaction_category_requires_admin(api_client):
    response = api_client.post(
        "/api/interaction-categories",
        {"categoryName": "HI-Union", "order": "3"},
        format="json",
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_create_interaction_category_as_admin(auth_client):
    AdminSettings.objects.get_or_create(pk=1)
    response = auth_client.post(
        "/api/interaction-categories",
        {
            "categoryName": "HI-Union",
            "order": "3",
            "colorScheme": "#7c3aed",
            "description": "High-quality binary interactions",
        },
        format="json",
    )
    assert response.status_code == 201
    data = response.json()
    assert data["categoryName"] == "HI-Union"
    assert "id" in data


@pytest.mark.django_db
def test_patch_interaction_category(auth_client):
    from interactions.models import InteractionCategory

    settings_obj, _ = AdminSettings.objects.get_or_create(pk=1)
    cat = InteractionCategory.objects.create(
        admin_settings=settings_obj,
        category_name="Literature",
        order="1",
        color_scheme="#0ea5e9",
    )
    response = auth_client.patch(
        f"/api/interaction-categories/{cat.pk}",
        {"colorScheme": "#ff0000"},
        format="json",
    )
    assert response.status_code == 200
    assert response.json()["colorScheme"] == "#ff0000"


@pytest.mark.django_db
def test_delete_interaction_category(auth_client):
    from interactions.models import InteractionCategory

    settings_obj, _ = AdminSettings.objects.get_or_create(pk=1)
    cat = InteractionCategory.objects.create(
        admin_settings=settings_obj, category_name="ToDelete", order="1"
    )
    response = auth_client.delete(f"/api/interaction-categories/{cat.pk}")
    assert response.status_code == 204
    assert not InteractionCategory.objects.filter(pk=cat.pk).exists()
