import pytest

from core.models import User
from sharing.models import Comment, Notification, SavedView, Share


@pytest.fixture
def other_user(db):
    return User.objects.create_user("colleague", "colleague@example.com", "pass12345")


@pytest.fixture
def saved_view(regular_user):
    return SavedView.objects.create(
        user=regular_user,
        name="MAPK cluster",
        query="MAPK1",
        state={"scoreFilter": 0.4, "selectedLayout": "cose"},
    )


def bearer(api_client, user):
    from rest_framework_simplejwt.tokens import RefreshToken

    api_client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}"
    )
    return api_client


@pytest.mark.django_db
def test_saved_view_round_trips_its_state(user_auth_client):
    state = {"scoreFilter": 0.6, "tissueFilter": ["liver"], "selectedLayout": "grid"}
    created = user_auth_client.post(
        "/api/saved-views/",
        {"name": "Liver view", "query": "TP53", "state": state},
        format="json",
    )
    assert created.status_code == 201
    assert created.json()["state"] == state

    listed = user_auth_client.get("/api/saved-views/")
    assert [v["name"] for v in listed.json()] == ["Liver view"]


@pytest.mark.django_db
def test_saved_views_are_private(user_auth_client, other_user, saved_view):
    assert len(user_auth_client.get("/api/saved-views/").json()) == 1
    bearer(user_auth_client, other_user)
    assert user_auth_client.get("/api/saved-views/").json() == []


@pytest.mark.django_db
def test_sharing_notifies_the_recipient(user_auth_client, other_user, saved_view):
    response = user_auth_client.post(
        "/api/shares/",
        {
            "saved_view": saved_view.pk,
            "recipient": other_user.username,
            "note": "Look at the liver cluster",
        },
        format="json",
    )
    assert response.status_code == 201
    body = response.json()
    assert body["note"] == "Look at the liver cluster"
    assert body["saved_view"]["state"] == saved_view.state
    assert body["recipient"]["username"] == "colleague"

    note = Notification.objects.get(user=other_user)
    assert "MAPK cluster" in note.text
    assert note.link == f"/shared/{body['id']}"
    assert note.read is False


@pytest.mark.django_db
def test_undiscoverable_user_looks_like_no_user(
    user_auth_client, other_user, saved_view
):
    other_user.discoverable = False
    other_user.save(update_fields=["discoverable"])
    response = user_auth_client.post(
        "/api/shares/",
        {"saved_view": saved_view.pk, "recipient": other_user.username},
        format="json",
    )
    assert response.status_code == 400
    # Byte-for-byte the answer for a username nobody holds, so the endpoint
    # cannot be used to discover that this account exists.
    missing = user_auth_client.post(
        "/api/shares/",
        {"saved_view": saved_view.pk, "recipient": "ghost"},
        format="json",
    )
    assert response.json() == missing.json()


@pytest.mark.django_db
def test_cannot_share_someone_elses_view(user_auth_client, other_user, saved_view):
    bearer(user_auth_client, other_user)
    response = user_auth_client.post(
        "/api/shares/",
        {"saved_view": saved_view.pk, "recipient": "testuser"},
        format="json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_recipient_sees_share_and_revoking_removes_it(
    user_auth_client, regular_user, other_user, saved_view
):
    share = Share.objects.create(
        saved_view=saved_view, sender=regular_user, recipient=other_user
    )
    bearer(user_auth_client, other_user)
    assert [s["id"] for s in user_auth_client.get("/api/shares/").json()] == [share.pk]
    assert user_auth_client.get(f"/api/shares/{share.pk}/").status_code == 200

    bearer(user_auth_client, regular_user)
    assert user_auth_client.get("/api/shares/?direction=sent").json()[0]["id"] == (
        share.pk
    )
    assert user_auth_client.delete(f"/api/shares/{share.pk}/").status_code == 204

    bearer(user_auth_client, other_user)
    assert user_auth_client.get(f"/api/shares/{share.pk}/").status_code == 404


@pytest.mark.django_db
def test_outsider_cannot_read_a_share(
    user_auth_client, regular_user, other_user, saved_view
):
    share = Share.objects.create(
        saved_view=saved_view, sender=regular_user, recipient=other_user
    )
    outsider = User.objects.create_user("outsider", "out@example.com", "pass12345")
    bearer(user_auth_client, outsider)
    assert user_auth_client.get(f"/api/shares/{share.pk}/").status_code == 404
    assert user_auth_client.get(f"/api/shares/{share.pk}/comments").status_code == 404


@pytest.mark.django_db
def test_comment_notifies_only_the_other_party(
    user_auth_client, regular_user, other_user, saved_view
):
    share = Share.objects.create(
        saved_view=saved_view, sender=regular_user, recipient=other_user
    )
    Notification.objects.all().delete()
    response = user_auth_client.post(
        f"/api/shares/{share.pk}/comments",
        {"body": "The liver edges look wrong"},
        format="json",
    )
    assert response.status_code == 201
    assert response.json()["author"]["username"] == "testuser"
    assert [n.user for n in Notification.objects.all()] == [other_user]

    bearer(user_auth_client, other_user)
    listed = user_auth_client.get(f"/api/shares/{share.pk}/comments").json()
    assert [c["body"] for c in listed] == ["The liver edges look wrong"]


@pytest.mark.django_db
def test_empty_comment_rejected(user_auth_client, regular_user, other_user, saved_view):
    share = Share.objects.create(
        saved_view=saved_view, sender=regular_user, recipient=other_user
    )
    response = user_auth_client.post(
        f"/api/shares/{share.pk}/comments", {"body": "   "}, format="json"
    )
    assert response.status_code == 400
    assert Comment.objects.count() == 0


@pytest.mark.django_db
def test_deleting_a_share_takes_its_comments(
    user_auth_client, regular_user, other_user, saved_view
):
    share = Share.objects.create(
        saved_view=saved_view, sender=regular_user, recipient=other_user
    )
    Comment.objects.create(share=share, author=regular_user, body="hi")
    user_auth_client.delete(f"/api/shares/{share.pk}/")
    assert Comment.objects.count() == 0


@pytest.mark.django_db
def test_notifications_listed_and_marked_read(user_auth_client, regular_user):
    note = Notification.objects.create(
        user=regular_user, text="someone shared a network", link="/shared/1"
    )
    listed = user_auth_client.get("/api/notifications/").json()
    assert [n["read"] for n in listed] == [False]

    patched = user_auth_client.patch(
        f"/api/notifications/{note.pk}/", {"read": True}, format="json"
    )
    assert patched.status_code == 200
    note.refresh_from_db()
    assert note.read is True


@pytest.mark.django_db
def test_notifications_are_private(user_auth_client, regular_user, other_user):
    Notification.objects.create(user=regular_user, text="mine", link="")
    bearer(user_auth_client, other_user)
    assert user_auth_client.get("/api/notifications/").json() == []


@pytest.mark.django_db
def test_sharing_requires_login(api_client, saved_view, other_user):
    response = api_client.post(
        "/api/shares/",
        {"saved_view": saved_view.pk, "recipient": other_user.username},
        format="json",
    )
    assert response.status_code == 401
