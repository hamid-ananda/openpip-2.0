from celery import shared_task

from proteins.uniprot import enrich_proteins_from_uniprot
from .upload_parser import process_line_batch, parse_and_ingest_csv

BATCH_SIZE = 300


@shared_task(bind=True)
def import_dataset_task(
    self,
    lines: list[str],
    dataset_name: str,
    interaction_status: str,
    category_id: int | None,
    fmt: str = "tab",
) -> dict:
    """
    Process a dataset import asynchronously.
    Supports PSI-MI TAB (fmt='tab') and simple CSV (fmt='csv').
    Splits TAB files into batches; CSV is processed in one pass.
    Enriches newly created proteins from UniProt after completion.
    Returns the final totals dict on SUCCESS.
    """
    if not lines:
        return {
            "progress": 100,
            "proteins_created": 0,
            "interactions_created": 0,
            "interactions_skipped": 0,
            "errors": [],
        }

    if fmt == "csv":
        self.update_state(state="PROGRESS", meta={"progress": 0})
        file_bytes = "\n".join(lines).encode("utf-8")
        result = parse_and_ingest_csv(
            file_bytes, dataset_name, interaction_status, category_id
        )
        enrich_proteins_from_uniprot(result.get("new_protein_ids", []))
        return {
            "progress": 100,
            "proteins_created": result["proteins_created"],
            "interactions_created": result["interactions_created"],
            "interactions_skipped": result["interactions_skipped"],
            "errors": result["errors"],
        }

    # TAB: batch processing with per-batch progress updates
    batches = [lines[i : i + BATCH_SIZE] for i in range(0, len(lines), BATCH_SIZE)]
    totals = {
        "proteins_created": 0,
        "interactions_created": 0,
        "interactions_skipped": 0,
        "errors": [],
    }
    all_new_protein_ids: list[int] = []

    for i, batch in enumerate(batches):
        result = process_line_batch(
            batch, dataset_name, interaction_status, category_id
        )
        totals["proteins_created"] += result.get("proteins_created", 0)
        totals["interactions_created"] += result.get("interactions_created", 0)
        totals["interactions_skipped"] += result.get("interactions_skipped", 0)
        if result.get("errors"):
            totals["errors"].extend(result["errors"])
        all_new_protein_ids.extend(result.get("new_protein_ids", []))

        progress = round(((i + 1) / len(batches)) * 100)
        self.update_state(
            state="PROGRESS",
            meta={**totals, "progress": progress},
        )

    enrich_proteins_from_uniprot(all_new_protein_ids)

    return {**totals, "progress": 100}
