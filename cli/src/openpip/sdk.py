from __future__ import annotations
from typing import Optional, Union
from pathlib import Path
from .client import APIClient
from .models import Protein, Interaction, Dataset, NetworkData
from .config import get_or_create_config, DEFAULT_URL

# TODO(phase5): Publish to PyPI as 'openpip' — confirm package name with Dr. Helmy first
# TODO(phase5): Add openpip logout command (clear token from config)
# TODO(phase5): Add openpip db shell (opens psql via docker exec)
# TODO(phase5): Add openpip db backup command
# TODO(phase5): Rate limiting on public API endpoints
# TODO(phase5): R client package (rOpenPIP) — mirrors Python SDK


class OpenPIP:
    """
    openPIP Python SDK.

    Usage:
        from openpip import OpenPIP
        client = OpenPIP()
        client = OpenPIP(url="http://localhost:8001")
        client = OpenPIP(username="admin", password="secret")
    """

    def __init__(
        self,
        url: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        token: Optional[str] = None,
    ):
        if url is None:
            cfg = get_or_create_config()
            url = cfg.url
            if token is None and cfg.token:
                token = cfg.token
            if username is None and cfg.username:
                username = cfg.username

        if username and password and token is None:
            from .auth import fetch_token
            token = fetch_token(url, username, password)

        self._client = APIClient(url=url, token=token)

    def search(self, query: str, as_dataframe: bool = False) -> list[Protein]:
        """Search proteins by gene name, UniProt ID, or Ensembl ID."""
        all_results = []
        page = 1
        while True:
            data = self._client.search(query, page=page)
            all_results.extend(data.get("results", []))
            if not data.get("next"):
                break
            page += 1
        proteins = [Protein.model_validate(r) for r in all_results]
        if as_dataframe:
            return self._to_dataframe([p.model_dump() for p in proteins])
        return proteins

    def protein(self, protein_id: int) -> Protein:
        """Get full protein detail by ID."""
        return Protein.model_validate(self._client.protein(protein_id))

    def interactions(self, protein_id: int, as_dataframe: bool = False) -> list[Interaction]:
        """Get all interactions for a protein."""
        all_results = []
        page = 1
        while True:
            data = self._client.interactions(protein_id, page=page)
            all_results.extend(data.get("results", []))
            if not data.get("next"):
                break
            page += 1
        items = [Interaction.model_validate(r) for r in all_results]
        if as_dataframe:
            rows = [
                {
                    "interactor_a": i.interactor_A.gene_name or i.interactor_A.uniprot_id,
                    "interactor_b": i.interactor_B.gene_name or i.interactor_B.uniprot_id,
                    "score": i.score,
                    "interaction_id": i.id,
                }
                for i in items
            ]
            return self._to_dataframe(rows)
        return items

    def network(self, protein_id: int) -> NetworkData:
        """Get Cytoscape.js network data for a protein."""
        return NetworkData.model_validate(self._client.network(protein_id))

    def datasets(self, as_dataframe: bool = False) -> list[Dataset]:
        """List all available datasets."""
        all_results = []
        page = 1
        while True:
            data = self._client.datasets(page=page)
            all_results.extend(data.get("results", []))
            if not data.get("next"):
                break
            page += 1
        items = [Dataset.model_validate(r) for r in all_results]
        if as_dataframe:
            return self._to_dataframe([d.model_dump() for d in items])
        return items

    def download(self, dataset_id: int, path: Optional[str] = None) -> Path:
        """Download a dataset file."""
        content = self._client.download(dataset_id)
        out = Path(path) if path else Path(f"dataset_{dataset_id}.tab")
        out.write_bytes(content)
        return out

    def psicquic(self, query: str, format: str = "tab25", first: int = 0, max_results: int = 200) -> Union[str, list]:
        """PSICQUIC MIQL query."""
        return self._client.psicquic(query, fmt=format, first=first, max_results=max_results)

    def export_network(self, protein_id: int, path: str) -> Path:
        """Export network as image or data file. Format detected from extension."""
        from .export import export_network
        network = self.network(protein_id)
        return export_network(network, path)

    def upload(self, file_path: str, name: str) -> dict:
        """Upload a PSI-MI TAB dataset. Requires admin credentials."""
        return self._client.upload(file_path, name)

    def _to_dataframe(self, rows: list[dict]):
        try:
            import pandas as pd
            return pd.DataFrame(rows)
        except ImportError:
            raise ImportError(
                "pandas is required for as_dataframe=True. "
                "Install it with: pip install pandas"
            )

    def close(self) -> None:
        self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
