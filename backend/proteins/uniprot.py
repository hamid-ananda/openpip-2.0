"""UniProt REST API client and protein enrichment helper."""

import logging

import requests

logger = logging.getLogger(__name__)

UNIPROT_SEARCH = "https://rest.uniprot.org/uniprotkb/search"
UNIPROT_FIELDS = "accession,gene_names,protein_name,sequence,cc_function,xref_ensembl,xref_geneid"
BATCH_SIZE = 50
TIMEOUT = 30


def fetch_uniprot_data(accessions: list[str]) -> dict[str, dict]:
    """Fetch UniProt entries for a list of accessions. Returns {accession: entry}."""
    if not accessions:
        return {}

    query = " OR ".join(f"accession:{acc}" for acc in accessions)
    params = {
        "query": query,
        "format": "json",
        "fields": UNIPROT_FIELDS,
        "size": len(accessions),
    }
    resp = requests.get(UNIPROT_SEARCH, params=params, timeout=TIMEOUT)
    resp.raise_for_status()

    return {
        entry["primaryAccession"]: entry
        for entry in resp.json().get("results", [])
        if "primaryAccession" in entry
    }


def _extract_protein_name(entry: dict) -> str:
    try:
        return entry["proteinDescription"]["recommendedName"]["fullName"]["value"]
    except (KeyError, TypeError):
        pass
    try:
        return entry["proteinDescription"]["submissionNames"][0]["fullName"]["value"]
    except (KeyError, TypeError, IndexError):
        return ""


def _extract_gene_name(entry: dict) -> str:
    try:
        return entry["genes"][0]["geneName"]["value"]
    except (KeyError, TypeError, IndexError):
        return ""


def _extract_sequence(entry: dict) -> str:
    try:
        return entry["sequence"]["value"]
    except (KeyError, TypeError):
        return ""


def _extract_description(entry: dict) -> str:
    for comment in entry.get("comments", []):
        if comment.get("commentType") == "FUNCTION":
            texts = comment.get("texts", [])
            if texts:
                return texts[0].get("value", "")
    return ""


def _extract_ensembl_id(entry: dict) -> str:
    """Return Ensembl gene ID (no version suffix) from UniProt cross-references."""
    for xref in entry.get("uniProtKBCrossReferences", []):
        if xref.get("database") == "Ensembl":
            for prop in xref.get("properties", []):
                if prop.get("key") == "GeneId":
                    gene_id = prop["value"]
                    return gene_id.rsplit(".", 1)[0] if "." in gene_id else gene_id
    return ""


def _extract_entrez_id(entry: dict) -> str:
    """Return Entrez Gene ID from UniProt cross-references."""
    for xref in entry.get("uniProtKBCrossReferences", []):
        if xref.get("database") == "GeneID":
            return xref.get("id", "")
    return ""


def enrich_proteins_from_uniprot(protein_ids: list[int]) -> tuple[int, bool]:
    """
    Fetch UniProt metadata for proteins with a known uniprot_id and fill in
    any fields that are currently null/empty.  Only fills — never overwrites.
    Returns (count_updated, had_error).
    """
    from proteins.models import Protein

    proteins = list(
        Protein.objects.filter(id__in=protein_ids)
        .exclude(uniprot_id__isnull=True)
        .exclude(uniprot_id="")
    )
    if not proteins:
        return 0, False

    accessions = [p.uniprot_id for p in proteins]
    try:
        uniprot_data = fetch_uniprot_data(accessions)
    except Exception:
        logger.warning("UniProt enrichment failed — skipping", exc_info=True)
        return 0, True

    updated = 0
    for protein in proteins:
        entry = uniprot_data.get(protein.uniprot_id)
        if not entry:
            continue

        changed = False
        if not protein.protein_name:
            name = _extract_protein_name(entry)
            if name:
                protein.protein_name = name
                changed = True
        if not protein.gene_name:
            gene = _extract_gene_name(entry)
            if gene:
                protein.gene_name = gene
                changed = True
        if not protein.sequence:
            seq = _extract_sequence(entry)
            if seq:
                protein.sequence = seq
                changed = True
        if not protein.description:
            desc = _extract_description(entry)
            if desc:
                protein.description = desc
                changed = True
        if not protein.ensembl_id:
            eid = _extract_ensembl_id(entry)
            if eid:
                protein.ensembl_id = eid
                changed = True
        if not protein.entrez_id:
            tid = _extract_entrez_id(entry)
            if tid:
                protein.entrez_id = tid
                changed = True

        if changed:
            protein.save(
                update_fields=[
                    "protein_name", "gene_name", "sequence", "description",
                    "ensembl_id", "entrez_id",
                ]
            )
            updated += 1

    return updated, False
