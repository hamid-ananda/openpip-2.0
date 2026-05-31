from textual.app import ComposeResult
from textual.screen import Screen
from textual.widgets import Static, Header, Footer
from textual.containers import Vertical
from textual.binding import Binding
from textual import work
from openpip.models import Protein
from ..widgets.protein_card import ProteinCard
from ..widgets.interaction_table import InteractionTable


class ProteinScreen(Screen):
    """Protein detail screen with full info and interaction list."""

    BINDINGS = [
        Binding("escape", "app.pop_screen()", "Back"),
        Binding("n", "view_network", "Network"),
    ]

    def __init__(self):
        super().__init__()
        self._protein: Protein | None = None

    def compose(self) -> ComposeResult:
        yield Header()
        with Vertical():
            yield ProteinCard("[dim]Loading...[/dim]", id="protein-card", classes="panel")
            yield Static("[bold cyan]Interactions[/bold cyan]", classes="title")
            yield InteractionTable(id="interaction-table")
        yield Footer()

    def load_protein(self, protein: Protein) -> None:
        self._protein = protein
        if self.is_attached:
            self.query_one("#protein-card", ProteinCard).show(protein)
            self._fetch_interactions(protein.id)

    def on_mount(self) -> None:
        if self._protein:
            self.query_one("#protein-card", ProteinCard).show(self._protein)
            self._fetch_interactions(self._protein.id)

    @work(thread=True)
    def _fetch_interactions(self, protein_id: int) -> None:
        from openpip import OpenPIP
        try:
            interactions = OpenPIP().interactions(protein_id)
        except Exception:
            interactions = []
        self.app.call_from_thread(
            self.query_one("#interaction-table", InteractionTable).load_interactions,
            interactions,
        )

    def action_view_network(self) -> None:
        if self._protein:
            screen = self.app.get_screen("network")
            screen.load_network(self._protein)
            self.app.push_screen("network")
