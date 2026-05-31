import pytest


@pytest.mark.django_db
def test_cors_headers_present_on_api(api_client):
    """Public API must be callable from any external website."""
    response = api_client.get(
        "/api/interactions/search/?q=BRCA1",
        HTTP_ORIGIN="https://some-external-lab.org",
    )
    assert "Access-Control-Allow-Origin" in response
    assert response["Access-Control-Allow-Origin"] == "*"


@pytest.mark.django_db
def test_cors_preflight_allowed(api_client):
    response = api_client.options(
        "/api/interactions/search/",
        HTTP_ORIGIN="https://some-external-lab.org",
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
    )
    assert response.status_code in (200, 204)
