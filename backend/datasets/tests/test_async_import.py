"""Tests for the async Celery import endpoints."""

from unittest.mock import MagicMock, patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

SAMPLE_TAB = (
    'uniprotkb:P12345\tuniprotkb:P67890\t-\t-\t-\t-\tpsi-mi:"MI:0018"(two hybrid)\t'
    "Smith et al.(2020)\tpubmed:32000001\ttaxid:9606(human)\ttaxid:9606(human)\t"
    "-\t-\t-\tintact-miscore:0.56\n"
)


@pytest.mark.django_db
def test_async_import_returns_task_id(auth_client):
    f = SimpleUploadedFile("test.tab", SAMPLE_TAB.encode(), content_type="text/plain")
    with patch("datasets.views.import_dataset_task.delay") as mock_delay:
        mock_delay.return_value = MagicMock(id="test-task-123")
        response = auth_client.post(
            "/api/datasets/import-async",
            {
                "file": f,
                "dataset_name": "TestDS",
                "interaction_status": "published",
            },
            format="multipart",
        )
    assert response.status_code == 202
    assert response.json()["task_id"] == "test-task-123"


@pytest.mark.django_db
def test_async_import_requires_admin(user_auth_client):
    f = SimpleUploadedFile("test.tab", SAMPLE_TAB.encode(), content_type="text/plain")
    response = user_auth_client.post(
        "/api/datasets/import-async",
        {"file": f, "dataset_name": "TestDS", "interaction_status": "published"},
        format="multipart",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_async_import_status_pending(auth_client):
    with patch("datasets.views.AsyncResult") as mock_ar:
        mock_ar.return_value.state = "PENDING"
        mock_ar.return_value.info = None
        response = auth_client.get("/api/datasets/import-async/test-task-123")
    assert response.status_code == 200
    data = response.json()
    assert data["task_id"] == "test-task-123"
    assert data["status"] == "PENDING"


@pytest.mark.django_db
def test_async_import_status_progress(auth_client):
    with patch("datasets.views.AsyncResult") as mock_ar:
        mock_ar.return_value.state = "PROGRESS"
        mock_ar.return_value.info = {
            "progress": 55,
            "proteins_created": 10,
            "interactions_created": 50,
            "interactions_skipped": 2,
            "errors": [],
        }
        response = auth_client.get("/api/datasets/import-async/abc-456")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "PROGRESS"
    assert data["progress"] == 55
    assert data["proteins_created"] == 10


@pytest.mark.django_db
def test_async_import_status_success(auth_client):
    with patch("datasets.views.AsyncResult") as mock_ar:
        mock_ar.return_value.state = "SUCCESS"
        mock_ar.return_value.result = {
            "progress": 100,
            "proteins_created": 20,
            "interactions_created": 100,
            "interactions_skipped": 0,
            "errors": [],
        }
        response = auth_client.get("/api/datasets/import-async/done-789")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["progress"] == 100
    assert data["interactions_created"] == 100


@pytest.mark.django_db
def test_task_status_forwards_stage_from_progress_meta(auth_client):
    """The GET view must include 'stage' from Celery task meta."""
    mock_result = MagicMock()
    mock_result.state = "PROGRESS"
    mock_result.info = {
        "progress": 50,
        "stage": "enriching_uniprot",
        "proteins_created": 0,
        "interactions_created": 0,
        "interactions_skipped": 0,
        "errors": [],
    }

    with patch("datasets.views.AsyncResult", return_value=mock_result):
        resp = auth_client.get("/api/datasets/import-async/fake-task-id")

    assert resp.status_code == 200
    assert resp.json()["stage"] == "enriching_uniprot"
