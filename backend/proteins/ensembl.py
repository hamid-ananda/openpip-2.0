"""Ensembl REST API client for gene-name enrichment."""

import logging

import requests

logger = logging.getLogger(__name__)

ENSEMBL_XREFS = (
    "https://rest.ensembl.org/xrefs/id/{ensembl_id}?content-type=application/json"
)
TIMEOUT = 10


def fetch_gene_name_from_ensembl(ensembl_id: str) -> str | None:
    """Return the display_id (gene symbol) for an Ensembl gene ID, or None."""
    url = ENSEMBL_XREFS.format(ensembl_id=ensembl_id)
    resp = requests.get(url, timeout=TIMEOUT)
    resp.raise_for_status()
    results = resp.json()
    if results:
        return results[0].get("display_id")
    return None


def enrich_proteins_from_ensembl(protein_ids: list[int]) -> tuple[int, bool]:
    """
    Fill gene_name for proteins that have an ensembl_id but no gene_name.
    Returns (count_updated, had_error).
    """
    from django.db.models import Q
    from proteins.models import Protein

    proteins = list(
        Protein.objects.filter(id__in=protein_ids)
        .exclude(ensembl_id__isnull=True)
        .exclude(ensembl_id="")
        .filter(Q(gene_name__isnull=True) | Q(gene_name=""))
    )
    if not proteins:
        return 0, False

    had_error = False
    updated = 0
    for protein in proteins:
        try:
            name = fetch_gene_name_from_ensembl(protein.ensembl_id)
        except Exception:
            logger.warning(
                "Ensembl lookup failed for %s", protein.ensembl_id, exc_info=True
            )
            had_error = True
            continue
        if name:
            protein.gene_name = name
            protein.save(update_fields=["gene_name"])
            updated += 1

    return updated, had_error
