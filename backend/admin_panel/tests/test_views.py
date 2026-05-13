import pytest
from admin_panel.models import AdminSettings, Announcement
from django.utils import timezone


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
