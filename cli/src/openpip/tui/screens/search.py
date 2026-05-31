from textual.app import ComposeResult
from textual.screen import Screen
from textual.widgets import Input, ListView, ListItem, Label, Header, Footer
from textual.containers import Horizontal, Vertical
from textual.binding import Binding
from textual import work
from openpip.models import Protein
from ..widgets.protein_card import ProteinCard


class SearchScreen(Screen):
    """Search screen — live search with results list and detail panel."""

    BINDINGS = [
        Binding("escape", "app.pop_screen()", "Back"),
        Binding("n", "view_network", "Network"),
    ]

    def __init__(self):
        super().__init__()
        self._results: list[Protein] = []
        self._selected: Protein | None = None

    def compose(self) -> ComposeResult:
        yield Header()
        with Vertical():
            yield Input(placeholder="Search proteins (gene name, UniProt ID)...", id="search-input")
            with Horizontal():
                with Vertical(id="results-panel"):
                    yield ListView(id="results-list")
                with Vertical(id="detail-panel", classes="panel"):
                    yield ProteinCard("[dim]Select a protein to see details.[/dim]", id="protein-card")
        yield Footer()

    def on_mount(self) -> None:
        self.query_one("#search-input", Input).focus()

    def on_input_changed(self, event: Input.Changed) -> None:
        if len(event.value) >= 2:
            self._do_search(event.value)
        elif event.value == "":
            self.query_one("#results-list", ListView).clear()
            self._results = []

    @work(thread=True)
    def _do_search(self, query: str) -> None:
        from openpip import OpenPIP
        try:
            results = OpenPIP().search(query)
        except Exception:
            results = []
        self.app.call_from_thread(self._update_results, results)

    def _update_results(self, results: list[Protein]) -> None:
        self._results = results
        list_view = self.query_one("#results-list", ListView)
        list_view.clear()
        for protein in results:
            label = f"{protein.gene_name or '?'}  [dim]{protein.uniprot_id or ''}[/dim]"
            list_view.append(ListItem(Label(label)))

    def on_list_view_selected(self, event: ListView.Selected) -> None:
        idx = event.list_view.index
        if idx is not None and 0 <= idx < len(self._results):
            self._selected = self._results[idx]
            self.query_one("#protein-card", ProteinCard).show(self._selected)

    def on_list_view_highlighted(self, event: ListView.Highlighted) -> None:
        idx = event.list_view.index
        if idx is not None and 0 <= idx < len(self._results):
            self._selected = self._results[idx]
            self.query_one("#protein-card", ProteinCard).show(self._selected)

    def action_view_interactions(self) -> None:
        if self._selected:
            screen = self.app.get_screen("protein")
            screen.load_protein(self._selected)
            self.app.push_screen("protein")

    def action_view_network(self) -> None:
        if self._selected:
            screen = self.app.get_screen("network")
            screen.load_network(self._selected)
            self.app.push_screen("network")
