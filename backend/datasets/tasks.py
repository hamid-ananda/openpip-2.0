from celery import shared_task

from .upload_parser import process_line_batch

BATCH_SIZE = 300


@shared_task(bind=True)
def import_dataset_task(
    self,
    lines: list[str],
    dataset_name: str,
    interaction_status: str,
    category_id: int | None,
) -> dict:
    """
    Process a PSI-MI TAB dataset import asynchronously.
    Splits lines into batches, updates task state with progress after each batch.
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

    batches = [lines[i : i + BATCH_SIZE] for i in range(0, len(lines), BATCH_SIZE)]
    totals = {
        "proteins_created": 0,
        "interactions_created": 0,
        "interactions_skipped": 0,
        "errors": [],
    }

    for i, batch in enumerate(batches):
        result = process_line_batch(
            batch, dataset_name, interaction_status, category_id
        )
        totals["proteins_created"] += result.get("proteins_created", 0)
        totals["interactions_created"] += result.get("interactions_created", 0)
        totals["interactions_skipped"] += result.get("interactions_skipped", 0)
        if result.get("errors"):
            totals["errors"].extend(result["errors"])

        progress = round(((i + 1) / len(batches)) * 100)
        self.update_state(
            state="PROGRESS",
            meta={**totals, "progress": progress},
        )

    return {**totals, "progress": 100}
