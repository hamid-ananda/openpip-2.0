import pytest


@pytest.mark.django_db
def test_openapi_schema_accessible(client):
    response = client.get("/api/schema/")
    assert response.status_code == 200
    assert response["Content-Type"].startswith("application/vnd.oai.openapi")


@pytest.mark.django_db
def test_swagger_ui_accessible(client):
    response = client.get("/api/docs/")
    assert response.status_code == 200
    assert b"swagger" in response.content.lower()
