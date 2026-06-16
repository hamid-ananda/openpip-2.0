"""NCBI taxonomy API client for organism scientific-name enrichment."""

import logging
import time
import xml.etree.ElementTree as ET

import requests

logger = logging.getLogger(__name__)

NCBI_TAXONOMY = (
    "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    "?db=taxonomy&id={taxid}"
)
NCBI_DELAY = 0.34  # seconds between calls — keeps us under 3 req/sec without API key
TIMEOUT = 10


def fetch_scientific_name(taxonomy_id: str) -> str | None:
    """Return the NCBI scientific name for a taxonomy ID, or None."""
    url = NCBI_TAXONOMY.format(taxid=taxonomy_id)
    resp = requests.get(url, timeout=TIMEOUT)
    resp.raise_for_status()
    root = ET.fromstring(resp.text)
    for item in root.iter("Item"):
        if item.attrib.get("Name") == "ScientificName":
            return item.text
    return None


def enrich_organisms_from_ncbi(organism_ids: list[int]) -> tuple[int, bool]:
    """
    Fill scientific_name for newly created organisms that don't have one yet.
    Adds NCBI_DELAY between consecutive calls to stay within rate limits.
    Returns (count_updated, had_error).
    """
    from proteins.models import Organism

    organisms = list(
        Organism.objects.filter(id__in=organism_ids, scientific_name__isnull=True)
    )
    if not organisms:
        return 0, False

    had_error = False
    updated = 0
    for i, organism in enumerate(organisms):
        if i > 0:
            time.sleep(NCBI_DELAY)
        try:
            name = fetch_scientific_name(organism.taxonomy_id)
        except Exception:
            logger.warning(
                "NCBI lookup failed for taxid %s", organism.taxonomy_id, exc_info=True
            )
            had_error = True
            continue
        if name:
            organism.scientific_name = name
            organism.save(update_fields=["scientific_name"])
            updated += 1

    return updated, had_error
