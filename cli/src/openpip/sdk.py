from __future__ import annotations
import re
from typing import Optional, Union
from pathlib import Path
from .client import APIClient
from .models import Protein, Interaction, Dataset, NetworkData, NetworkNode, NetworkEdge
from .config import get_or_create_config

# SHELVED 2026-08-16: the CLI, SDK and TUI are parked while the web app is the
# focus. Not deprecated — just not being extended. Parked items carry the
# "shelved" tag below; anything still live keeps the "phase5" tag.
#
# Read this before unshelving: 14 of the 35 tests in cli/tests already fail
# (5 test_client, 3 test_commands, 6 test_sdk), and did so before the shelving —
# cli/ has had no commits since 7496b93. The ones inspected are respx mocks
# registering a trailing slash the client does not send (mock "/api/datasets/",
# request "/api/datasets"), so this looks like drift between the tests and the
# client rather than a broken SDK. Nobody has confirmed that for all 14. Fix the
# suite first when picking this back up; do not read a green-looking module as
# working code.
#
# TODO(shelved): Publish to PyPI as 'openpip' — confirm package name with Dr. Helmy first
# TODO(shelved): Add openpip logout command (clear token from config)
# TODO(shelved): Add openpip db shell (opens psql via docker exec)
# TODO(shelved): Add openpip db backup command
# TODO(shelved): R client package (rOpenPIP) — mirrors Python SDK. Decide before
#   building: the Phase 4 note rejected a JS SDK because CORS + OpenAPI already
#   cover external callers, and the same argument mostly applies to R.
#
# Rate limiting on the public API was listed here too. It is backend work, not
# SDK work, so it stays live at backend/psicquic/tab25.py rather than shelved.


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
        data = self._client.search(query)
        proteins = [Protein.model_validate(p) for p in data.get("all_proteins", [])]
        if as_dataframe:
            return self._to_dataframe([p.model_dump() for p in proteins])
        return proteins

    def search_full(self, query: str) -> dict:
        """Return raw search response including all_proteins, all_interactions, query_protein_id_array.

        Falls back to protein detail lookup for single-term queries that return no results
        (e.g. UniProt IDs, which the search index doesn't cover).
        """
        data = self._client.search(query)
        terms = [t for t in re.split(r"[,\s]+", query.strip()) if t]
        if data.get("all_proteins") or len(terms) != 1:
            return data
        # Single-term search returned nothing — resolve via protein detail, then re-search by gene name
        from .exceptions import NotFound
        try:
            prot = self._client.protein(terms[0])
            gene_name = prot.get("protein_gene_name")
            if gene_name:
                data = self._client.search(gene_name)
            else:
                data["all_proteins"] = [prot]
                data["query_protein_id_array"] = [prot["protein_id"]]
                data["unfound_protein_summary"] = ""
        except NotFound:
            pass
        return data

    def protein(self, identifier) -> Protein:
        """Get full protein detail by ID, UniProt ID, gene name, or Ensembl ID."""
        return Protein.model_validate(self._client.protein(identifier))

    def interactions(self, identifier, as_dataframe: bool = False) -> list[Interaction]:
        """Get all interactions for a protein (gene name, UniProt ID, or Ensembl ID)."""
        data = self._client.search(str(identifier))
        items = [Interaction.model_validate(i) for i in data.get("all_interactions", [])]
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

    def network(self, identifier) -> NetworkData:
        """Get interaction network for a protein as Cytoscape.js-compatible data."""
        data = self._client.search(str(identifier))
        query_ids = set(str(qid) for qid in data.get("query_protein_id_array", []))
        nodes = [
            NetworkNode(data={
                "id": str(p["protein_id"]),
                "label": p.get("protein_gene_name") or p.get("protein_uniprot_id", ""),
                "uniprot_id": p.get("protein_uniprot_id"),
                "is_query": str(p["protein_id"]) in query_ids,
            })
            for p in data.get("all_proteins", [])
        ]
        edges = [
            NetworkEdge(data={
                "id": str(i["interaction_id"]),
                "source": str(i["interactor_A"]["protein_id"]),
                "target": str(i["interactor_B"]["protein_id"]),
                "weight": i.get("score"),
            })
            for i in data.get("all_interactions", [])
        ]
        return NetworkData(nodes=nodes, edges=edges)

    def datasets(self, as_dataframe: bool = False) -> list[Dataset]:
        """List all available datasets."""
        items = [Dataset.model_validate(d) for d in self._client.datasets()]
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

    def export_network(self, identifier, path: str) -> Path:
        """Export network as image or data file. Format detected from extension."""
        from .export import export_network
        network = self.network(identifier)
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
