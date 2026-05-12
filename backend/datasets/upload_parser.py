"""PSI-MI TAB parser — mirrors legacy DataController::insertAction behavior."""

import csv
import io

from proteins.models import Protein, Identifier, ProteinIdentifier
from interactions.models import Interaction


def _get_naming_convention(identifier: str) -> str:
    lower = identifier.lower()
    if lower.startswith("uniprotkb:") or lower.startswith("uniprot:"):
        return "uniprotkb"
    if lower.startswith("ensembl:"):
        return "ensembl"
    if lower.startswith("entrez gene:") or lower.startswith("entrez:"):
        return "entrez"
    return "gene_name"


def _strip_prefix(identifier: str) -> str:
    if ":" in identifier:
        return identifier.split(":", 1)[1].strip()
    return identifier.strip()


def _protein_handler(raw_id: str) -> Protein:
    """Resolve or create a Protein from a raw PSI-MI identifier string."""
    clean_id = _strip_prefix(raw_id)
    naming_convention = _get_naming_convention(raw_id)

    identifier_obj = Identifier.objects.filter(identifier__iexact=clean_id).first()
    if identifier_obj:
        link = ProteinIdentifier.objects.filter(identifier=identifier_obj).first()
        if link:
            return link.protein

    protein = Protein.objects.create(
        uniprot_id=clean_id if naming_convention == "uniprotkb" else None,
        gene_name=clean_id if naming_convention == "gene_name" else None,
    )
    identifier_obj = Identifier.objects.create(
        identifier=clean_id,
        naming_convention=naming_convention,
    )
    ProteinIdentifier.objects.create(protein=protein, identifier=identifier_obj)
    return protein


def _is_new_interaction(protein_a: Protein, protein_b: Protein) -> bool:
    return not Interaction.objects.filter(
        interactor_A_id__in=[protein_a.id, protein_b.id],
        interactor_B_id__in=[protein_a.id, protein_b.id],
    ).exists()


def parse_and_ingest(file_bytes: bytes) -> dict:
    """
    Parse PSI-MI TAB file bytes and ingest interactions.
    Returns {'created': int, 'skipped': int, 'errors': list}.
    """
    created = 0
    skipped = 0
    errors = []

    text = file_bytes.decode("utf-8", errors="replace")
    reader = csv.reader(io.StringIO(text), delimiter="\t")

    for row_num, row in enumerate(reader):
        if row_num == 0 or not row:
            continue
        if len(row) < 2:
            continue

        raw_a = row[0].strip()
        raw_b = row[1].strip()
        if not raw_a or not raw_b:
            continue

        try:
            protein_a = _protein_handler(raw_a)
            protein_b = protein_a if raw_a == raw_b else _protein_handler(raw_b)

            if _is_new_interaction(protein_a, protein_b):
                Interaction.objects.create(
                    interactor_A=protein_a,
                    interactor_B=protein_b,
                    removed="0",
                )
                created += 1
            else:
                skipped += 1
        except Exception as exc:
            errors.append(f"Row {row_num}: {exc}")

    return {"created": created, "skipped": skipped, "errors": errors}
