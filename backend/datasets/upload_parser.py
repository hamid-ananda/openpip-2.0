"""PSI-MI TAB 2.7 parser — mirrors legacy DataController::insertAction behavior."""

import csv
import io
import re

from django.db import transaction

from datasets.models import Dataset
from interactions.models import (
    AnnotationInteraction,
    Interaction,
    InteractionDataset,
    InteractionInteractionCategory,
    InteractionSupportInformation,
    SupportInformation,
)
from proteins.models import (
    Annotation,
    Identifier,
    Organism,
    Protein,
    ProteinIdentifier,
    ProteinOrganism,
)

_MAX_ERRORS = 50

# psi-mi:"MI:1112"(two hybrid prey pooling approach)
_PSIMI_LABEL_RE = re.compile(r'psi-mi:"[^"]*"\(([^)]+)\)', re.IGNORECASE)
# taxid:9606(human)
_TAXID_RE = re.compile(r"taxid:(\d+)\(([^)]+)\)")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


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
    """Return True only when no non-removed interaction exists for this protein pair."""
    return not Interaction.objects.filter(
        interactor_A_id__in=[protein_a.id, protein_b.id],
        interactor_B_id__in=[protein_a.id, protein_b.id],
        removed="0",
    ).exists()


def _parse_psimi_label(raw: str) -> str | None:
    """Extract human-readable label from psi-mi:"MI:XXXX"(label) notation."""
    if not raw or raw.strip() == "-":
        return None
    m = _PSIMI_LABEL_RE.search(raw)
    return m.group(1).strip() if m else None


def _parse_taxon(raw: str) -> tuple[str, str] | None:
    """Return (taxonomy_id, name) from the first taxid token, or None."""
    if not raw or raw.strip() == "-":
        return None
    first_token = raw.split("|")[0].strip()
    m = _TAXID_RE.match(first_token)
    if m:
        return m.group(1), m.group(2)
    return None


def _parse_pubmed_id(pub_id_col: str) -> str | None:
    """Extract pubmed:NNNN from the publication identifier column."""
    if not pub_id_col or pub_id_col.strip() == "-":
        return None
    for token in pub_id_col.split("|"):
        token = token.strip()
        if token.lower().startswith("pubmed:"):
            return token.split(":", 1)[1].strip()
    return None


def _safe_col(row: list[str], idx: int) -> str:
    """Return stripped column value or empty string if index out of range."""
    if idx < len(row):
        return row[idx].strip()
    return ""


def _add_gene_name_aliases(protein: Protein, alias_col: str) -> None:
    """Parse alias column; add gene name identifiers not yet linked to protein."""
    if not alias_col or alias_col == "-":
        return
    for token in alias_col.split("|"):
        token = token.strip()
        if not token:
            continue
        # Match tokens like uniprotkb:SOMENAME(gene name)
        if "(gene name)" not in token.lower():
            continue
        # Strip trailing (gene name) qualifier
        name_part = re.sub(r"\([^)]*\)\s*$", "", token).strip()
        clean_name = _strip_prefix(name_part)
        if not clean_name:
            continue
        # Check if this identifier already exists and is linked to this protein
        existing = Identifier.objects.filter(identifier__iexact=clean_name).first()
        if existing:
            if ProteinIdentifier.objects.filter(
                protein=protein, identifier=existing
            ).exists():
                continue
            # Identifier exists but not linked to this protein — link it
            ProteinIdentifier.objects.create(protein=protein, identifier=existing)
        else:
            new_id = Identifier.objects.create(
                identifier=clean_name, naming_convention="gene_name"
            )
            ProteinIdentifier.objects.create(protein=protein, identifier=new_id)
        # Also update protein.gene_name if not set
        if not protein.gene_name:
            protein.gene_name = clean_name
            protein.save(update_fields=["gene_name"])


def _handle_taxon(protein: Protein, taxon_col: str) -> None:
    """Find-or-create Organism and link to protein if not already linked."""
    parsed = _parse_taxon(taxon_col)
    if not parsed:
        return
    taxonomy_id, name = parsed
    organism, _ = Organism.objects.get_or_create(
        taxonomy_id=taxonomy_id,
        defaults={"name": name},
    )
    ProteinOrganism.objects.get_or_create(protein=protein, organism=organism)


def _handle_dataset(
    interaction: Interaction,
    author_col: str,
    pub_id_col: str,
    dataset_name: str,
    interaction_status: str,
) -> None:
    """Find-or-create Dataset by pubmed_id and link to interaction."""
    pubmed_id = _parse_pubmed_id(pub_id_col)
    if not pubmed_id:
        return
    dataset, _ = Dataset.objects.get_or_create(
        pubmed_id=pubmed_id,
        defaults={
            "name": dataset_name,
            "author": author_col.strip() if author_col and author_col != "-" else None,
            "interaction_status": interaction_status,
        },
    )
    InteractionDataset.objects.get_or_create(interaction=interaction, dataset=dataset)


def _handle_detection_method(interaction: Interaction, method_col: str) -> None:
    """Store detection method label as Annotation (type_name='experiment')."""
    label = _parse_psimi_label(method_col)
    if not label:
        return
    ann = Annotation.objects.create(
        type_name="experiment",
        annotation=label,
        identifier=str(interaction.pk),
    )
    AnnotationInteraction.objects.create(interaction=interaction, annotation=ann)


def _handle_interaction_annotations(interaction: Interaction, ann_col: str) -> None:
    """Parse col 27 pipe-separated key:value pairs into Annotation rows."""
    if not ann_col or ann_col.strip() == "-":
        return
    for token in ann_col.split("|"):
        token = token.strip()
        if not token or ":" not in token:
            continue
        key, value = token.split(":", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            continue
        ann = Annotation.objects.create(
            type_name=key,
            annotation=value,
            identifier=str(interaction.pk),
        )
        AnnotationInteraction.objects.create(interaction=interaction, annotation=ann)


def _handle_support_info(interaction: Interaction, support_col: str) -> None:
    """Parse cols 25/26 semicolon-separated Key:Value pairs into SupportInformation rows."""
    if not support_col or support_col.strip() == "-":
        return
    for token in support_col.split(";"):
        token = token.strip()
        if not token or ":" not in token:
            continue
        key, value = token.split(":", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            continue
        si, _ = SupportInformation.objects.get_or_create(name=key)
        InteractionSupportInformation.objects.create(
            interaction=interaction,
            support_information=si,
            value=value,
        )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def process_line_batch(
    lines: list[str],
    dataset_name: str,
    interaction_status: str = "published",
    category_id: int | None = None,
) -> dict:
    """
    Ingest a pre-parsed batch of raw TSV data lines (no header).
    Reuses parse_and_ingest by prepending a '#' header so the
    row-0 skip logic works correctly.
    Each batch is committed atomically; batches are not atomic to each other.
    """
    file_bytes = ("#\n" + "\n".join(lines)).encode("utf-8")
    return parse_and_ingest(
        file_bytes,
        dataset_name=dataset_name,
        interaction_status=interaction_status,
        category_id=category_id,
        dry_run=False,
    )


def fast_preview(file_bytes: bytes) -> dict:
    """
    Cheap preview: parse the file without writing anything to the database.
    Collects all unique protein identifiers, then does two bulk DB queries
    (existing / new) instead of one query per row.

    Returns the same shape as parse_and_ingest so the frontend type is shared.
    interactions_skipped is 0 (full dedup requires DB writes; not worth it for preview).
    """
    text = file_bytes.decode("utf-8", errors="replace")
    reader = csv.reader(io.StringIO(text), delimiter="\t")

    seen_pairs: set[tuple[str, str]] = set()
    all_raw_ids: list[str] = []
    total_rows = 0
    errors: list[dict] = []

    for row_num, row in enumerate(reader):
        if row_num == 0 or (row and row[0].startswith("#")):
            continue
        if not row or len(row) < 2:
            continue

        raw_a = _safe_col(row, 0)
        raw_b = _safe_col(row, 1)
        if not raw_a or not raw_b:
            continue

        total_rows += 1
        key = (min(raw_a, raw_b), max(raw_a, raw_b))
        if key not in seen_pairs:
            seen_pairs.add(key)
            all_raw_ids.append(raw_a)
            if raw_a != raw_b:
                all_raw_ids.append(raw_b)

    unique_ids = {_strip_prefix(r).lower() for r in all_raw_ids}

    existing_lower = set(
        Identifier.objects.filter(identifier__in=list(unique_ids)).values_list(
            "identifier", flat=True
        )
    )
    existing_lower = {v.lower() for v in existing_lower}

    proteins_existing = sum(1 for uid in unique_ids if uid in existing_lower)
    proteins_created = len(unique_ids) - proteins_existing

    return {
        "dry_run": True,
        "rows_sampled": None,
        "proteins_created": proteins_created,
        "proteins_existing": proteins_existing,
        "interactions_created": total_rows,
        "interactions_skipped": 0,
        "errors": errors,
    }


def parse_and_ingest(
    file_bytes: bytes,
    dataset_name: str,
    interaction_status: str = "published",
    category_id: int | None = None,
    dry_run: bool = False,
) -> dict:
    """
    Parse PSI-MI TAB 2.7 file bytes and ingest interactions.

    In dry_run mode the entire operation is wrapped in an atomic block that
    is explicitly rolled back before returning — so counts are accurate but
    nothing is written to the database. Dry-run is capped at _DRY_RUN_MAX_ROWS
    data rows to keep preview fast; rows_sampled in the response reflects this.

    Returns::

        {
            "dry_run": bool,
            "rows_sampled": int | None,   # None means full file was processed
            "proteins_created": int,
            "proteins_existing": int,
            "interactions_created": int,
            "interactions_skipped": int,
            "errors": [{"row": int, "reason": str}],
        }
    """
    proteins_created = 0
    proteins_existing = 0
    interactions_created = 0
    interactions_skipped = 0
    errors: list[dict] = []

    text = file_bytes.decode("utf-8", errors="replace")
    reader = csv.reader(io.StringIO(text), delimiter="\t")

    def _run() -> None:
        nonlocal proteins_created, proteins_existing, interactions_created
        nonlocal interactions_skipped

        # Create/find the dataset by name once — not per-row via pubmed_id
        named_dataset = None
        if dataset_name:
            named_dataset, _ = Dataset.objects.get_or_create(
                name=dataset_name,
                defaults={"interaction_status": interaction_status},
            )

        for row_num, row in enumerate(reader):
            # Skip header row (row 0 or first row where col 0 starts with #)
            if row_num == 0 or (row and row[0].startswith("#")):
                continue
            if not row:
                continue
            if len(row) < 2:
                continue

            raw_a = _safe_col(row, 0)
            raw_b = _safe_col(row, 1)
            if not raw_a or not raw_b:
                continue

            sid = transaction.savepoint()
            try:
                # ── Proteins ────────────────────────────────────────────────
                existing_a = Identifier.objects.filter(
                    identifier__iexact=_strip_prefix(raw_a)
                ).exists()
                protein_a = _protein_handler(raw_a)
                if existing_a:
                    proteins_existing += 1
                else:
                    proteins_created += 1

                if raw_a == raw_b:
                    protein_b = protein_a
                else:
                    existing_b = Identifier.objects.filter(
                        identifier__iexact=_strip_prefix(raw_b)
                    ).exists()
                    protein_b = _protein_handler(raw_b)
                    if existing_b:
                        proteins_existing += 1
                    else:
                        proteins_created += 1

                # ── Aliases (cols 4+5) ──────────────────────────────────────
                _add_gene_name_aliases(protein_a, _safe_col(row, 4))
                if protein_b is not protein_a:
                    _add_gene_name_aliases(protein_b, _safe_col(row, 5))

                # ── Taxon (cols 9+10) ──────────────────────────────────────
                _handle_taxon(protein_a, _safe_col(row, 9))
                if protein_b is not protein_a:
                    _handle_taxon(protein_b, _safe_col(row, 10))

                # ── Dedup ──────────────────────────────────────────────────
                if not _is_new_interaction(protein_a, protein_b):
                    transaction.savepoint_commit(sid)
                    interactions_skipped += 1
                    continue

                # ── Score (col 14) ─────────────────────────────────────────
                score_raw = _safe_col(row, 14)
                score = None
                if score_raw and score_raw != "-":
                    first = score_raw.split("|")[0].strip()
                    raw_score = _strip_prefix(first)
                    score = raw_score[:10] if raw_score else None

                # ── Create Interaction ─────────────────────────────────────
                interaction = Interaction.objects.create(
                    interactor_A=protein_a,
                    interactor_B=protein_b,
                    score=score,
                    removed="0",
                )
                interactions_created += 1

                # ── Dataset ────────────────────────────────────────────────
                if named_dataset:
                    InteractionDataset.objects.get_or_create(
                        interaction=interaction, dataset=named_dataset
                    )

                # ── Detection method (col 6) ───────────────────────────────
                _handle_detection_method(interaction, _safe_col(row, 6))

                # ── Interaction annotations (col 27) ───────────────────────
                _handle_interaction_annotations(interaction, _safe_col(row, 27))

                # ── Support information (cols 25+26) ───────────────────────
                _handle_support_info(interaction, _safe_col(row, 25))
                if protein_b is not protein_a:
                    _handle_support_info(interaction, _safe_col(row, 26))

                # ── Category ───────────────────────────────────────────────
                if category_id is not None:
                    InteractionInteractionCategory.objects.create(
                        interaction=interaction,
                        interaction_category_id=category_id,
                    )

                transaction.savepoint_commit(sid)

            except Exception as exc:  # noqa: BLE001
                transaction.savepoint_rollback(sid)
                if len(errors) < _MAX_ERRORS:
                    errors.append({"row": row_num, "reason": str(exc)})

    with transaction.atomic():
        _run()
        if dry_run:
            transaction.set_rollback(True)

    return {
        "dry_run": dry_run,
        "rows_sampled": None,
        "proteins_created": proteins_created,
        "proteins_existing": proteins_existing,
        "interactions_created": interactions_created,
        "interactions_skipped": interactions_skipped,
        "errors": errors,
    }
