from __future__ import annotations
from typing import Optional
import httpx
from .exceptions import NotFound, ServerError, AuthRequired


class APIClient:
    """Raw HTTP client — one method per API endpoint. Returns dicts/strings."""

    def __init__(self, url: str, token: Optional[str] = None):
        self._base = url.rstrip("/")
        self._token = token
        self._http = httpx.Client(timeout=30)

    def _headers(self) -> dict:
        h = {"Accept": "application/json"}
        if self._token:
            h["Authorization"] = f"Bearer {self._token}"
        return h

    def _get(self, path: str, params: dict = None) -> dict | str:
        response = self._http.get(
            f"{self._base}{path}", params=params, headers=self._headers()
        )
        self._raise_for_status(response)
        ct = response.headers.get("Content-Type", "")
        if "text/plain" in ct:
            return response.text
        return response.json()

    def _post(self, path: str, **kwargs) -> dict:
        response = self._http.post(
            f"{self._base}{path}", headers=self._headers(), **kwargs
        )
        self._raise_for_status(response)
        return response.json()

    def _raise_for_status(self, response: httpx.Response) -> None:
        if response.status_code == 401:
            raise AuthRequired("Authentication required.")
        if response.status_code == 403:
            raise AuthRequired("Admin privileges required.")
        if response.status_code == 404:
            raise NotFound(f"Resource not found: {response.url}")
        if response.status_code >= 500:
            raise ServerError(f"Server error {response.status_code}: {response.url}")

    def search(self, query: str, page: int = 1) -> dict:
        return self._get("/api/search/", params={"q": query, "page": page})

    def protein(self, protein_id: int) -> dict:
        return self._get(f"/api/proteins/{protein_id}/")

    def interactions(self, protein_id: int, page: int = 1) -> dict:
        return self._get("/api/interactions/", params={"protein": protein_id, "page": page})

    def network(self, protein_id: int) -> dict:
        return self._get(f"/api/network/{protein_id}/")

    def datasets(self, page: int = 1) -> dict:
        return self._get("/api/datasets/", params={"page": page})

    def download(self, dataset_id: int) -> bytes:
        response = self._http.get(
            f"{self._base}/api/datasets/{dataset_id}/download/",
            headers=self._headers(),
        )
        self._raise_for_status(response)
        return response.content

    def psicquic(self, query: str, fmt: str = "tab25", first: int = 0, max_results: int = 200) -> str:
        return self._get(
            "/psicquic/rest/query",
            params={"q": query, "format": fmt, "firstResult": first, "maxResults": max_results},
        )

    def upload(self, file_path: str, name: str) -> dict:
        with open(file_path, "rb") as f:
            return self._post("/api/upload/", files={"file": f}, data={"name": name})

    def close(self) -> None:
        self._http.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
