from textual.widgets import DataTable
from openpip.models import Interaction


class InteractionTable(DataTable):
    """DataTable pre-configured for interaction data."""

    def on_mount(self) -> None:
        self.add_columns("ID", "Interactor A", "Interactor B", "Score")
        self.cursor_type = "row"
        self.zebra_stripes = True

    def load_interactions(self, interactions: list[Interaction]) -> None:
        self.clear()
        for i in interactions:
            score = i.score or "—"
            try:
                val = float(score)
                filled = int(val * 5)
                bar = "█" * filled + "░" * (5 - filled)
                score_str = f"{bar} {score}"
            except (ValueError, TypeError):
                score_str = score
            self.add_row(
                str(i.id),
                i.interactor_A.gene_name or i.interactor_A.uniprot_id or "—",
                i.interactor_B.gene_name or i.interactor_B.uniprot_id or "—",
                score_str,
            )
