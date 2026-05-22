"""Unit tests for import_dataset_task."""

from unittest.mock import patch

from django.test import override_settings

from datasets.tasks import import_dataset_task


def _make_batch_result(proteins=2, interactions=5, skipped=0, errors=None):
    return {
        "proteins_created": proteins,
        "interactions_created": interactions,
        "interactions_skipped": skipped,
        "errors": errors or [],
    }


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
    CELERY_RESULT_BACKEND="cache+memory://",
)
def test_task_empty_lines_returns_zeros_without_calling_parser():
    with patch("datasets.tasks.process_line_batch") as mock_plb:
        result = import_dataset_task.apply(args=[[], "TestDS", "published", None])
        data = result.get()
    mock_plb.assert_not_called()
    assert data["proteins_created"] == 0
    assert data["interactions_created"] == 0
    assert data["progress"] == 100


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
    CELERY_RESULT_BACKEND="cache+memory://",
)
def test_task_accumulates_totals_across_batches():
    lines = [f"line{i}" for i in range(10)]
    with patch("datasets.tasks.process_line_batch") as mock_plb:
        mock_plb.return_value = _make_batch_result(proteins=3, interactions=4)
        result = import_dataset_task.apply(args=[lines, "TestDS", "published", None])
        data = result.get()

    # With BATCH_SIZE=300 and 10 lines, there's 1 batch → called once
    assert mock_plb.call_count == 1
    assert data["proteins_created"] == 3
    assert data["interactions_created"] == 4
    assert data["progress"] == 100


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
    CELERY_RESULT_BACKEND="cache+memory://",
)
def test_task_accumulates_across_multiple_batches():
    """Force multiple batches by patching BATCH_SIZE."""
    lines = [f"line{i}" for i in range(10)]
    with patch("datasets.tasks.process_line_batch") as mock_plb, patch(
        "datasets.tasks.BATCH_SIZE", 3
    ):
        mock_plb.return_value = _make_batch_result(proteins=1, interactions=2)
        result = import_dataset_task.apply(args=[lines, "TestDS", "published", None])
        data = result.get()

    # 10 lines / batch_size 3 = 4 batches (3+3+3+1)
    assert mock_plb.call_count == 4
    assert data["proteins_created"] == 4  # 1 per batch × 4
    assert data["interactions_created"] == 8  # 2 per batch × 4
    assert data["progress"] == 100


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
    CELERY_RESULT_BACKEND="cache+memory://",
)
def test_task_collects_errors_from_all_batches():
    lines = [f"line{i}" for i in range(6)]
    with patch("datasets.tasks.process_line_batch") as mock_plb, patch(
        "datasets.tasks.BATCH_SIZE", 3
    ):
        mock_plb.return_value = _make_batch_result(errors=[{"row": 1, "reason": "bad"}])
        result = import_dataset_task.apply(args=[lines, "TestDS", "published", None])
        data = result.get()

    # 2 batches, each returning 1 error → 2 errors total
    assert len(data["errors"]) == 2


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
    CELERY_RESULT_BACKEND="cache+memory://",
)
def test_task_passes_category_id_to_parser():
    lines = ["line1"]
    with patch("datasets.tasks.process_line_batch") as mock_plb:
        mock_plb.return_value = _make_batch_result()
        import_dataset_task.apply(args=[lines, "TestDS", "published", 42])

    mock_plb.assert_called_once()
    _, kwargs = mock_plb.call_args
    # category_id is the 4th positional arg
    assert mock_plb.call_args[0][3] == 42


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
    CELERY_RESULT_BACKEND="cache+memory://",
)
def test_task_calls_uniprot_enrichment_after_import():
    """After all batches are processed, the task enriches newly imported proteins."""
    lines = ["line1"]
    with patch("datasets.tasks.process_line_batch") as mock_plb, patch(
        "datasets.tasks.enrich_proteins_from_uniprot"
    ) as mock_enrich:
        mock_plb.return_value = {
            "proteins_created": 2,
            "interactions_created": 1,
            "interactions_skipped": 0,
            "errors": [],
            "new_protein_ids": [10, 11],
        }
        import_dataset_task.apply(args=[lines, "TestDS", "published", None])

    mock_enrich.assert_called_once_with([10, 11])


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
    CELERY_RESULT_BACKEND="cache+memory://",
)
def test_task_calls_update_state_per_batch():
    lines = [f"line{i}" for i in range(6)]
    with patch("datasets.tasks.process_line_batch") as mock_plb, patch(
        "datasets.tasks.BATCH_SIZE", 3
    ):
        mock_plb.return_value = _make_batch_result()
        # Capture the task instance's update_state calls by patching it on the task
        with patch.object(import_dataset_task, "update_state") as mock_us:
            import_dataset_task.apply(args=[lines, "TestDS", "published", None])

    # 2 batches → 2 update_state calls
    assert mock_us.call_count == 2
    # First batch: 50%, second: 100%
    states = [c.kwargs["meta"]["progress"] for c in mock_us.call_args_list]
    assert states == [50, 100]
