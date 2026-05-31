from textual.app import ComposeResult
from textual.screen import Screen
from textual.widgets import Static, Header, Footer, Input, Button
from textual.containers import Vertical, Horizontal
from textual.binding import Binding
from textual import work
from openpip.models import Protein, NetworkData
from ..widgets.ascii_graph import AsciiGraph


class NetworkScreen(Screen):
    """Network view — ASCII graph with export option."""

    BINDINGS = [
        Binding("escape", "app.pop_screen()", "Back"),
        Binding("e", "focus_export", "Export"),
    ]

    def __init__(self):
        super().__init__()
        self._protein: Protein | None = None
        self._network: NetworkData | None = None

    def compose(self) -> ComposeResult:
        yield Header()
        with Vertical():
            yield AsciiGraph("[dim]Loading network...[/dim]", id="graph", classes="panel")
            with Horizontal(id="export-bar"):
                yield Input(
                    placeholder="Export path (e.g. graph.png, network.graphml, edges.tsv)",
                    id="export-input"
                )
                yield Button("Export", id="export-btn", variant="primary")
            yield Static("", id="export-status")
        yield Footer()

    def load_network(self, protein: Protein) -> None:
        self._protein = protein
        if self.is_attached:
            self.sub_title = f"Network: {protein.gene_name or protein.uniprot_id}"
            self._fetch_network(protein.id)

    def on_mount(self) -> None:
        if self._protein:
            self.sub_title = f"Network: {self._protein.gene_name or self._protein.uniprot_id}"
            self._fetch_network(self._protein.id)

    @work(thread=True)
    def _fetch_network(self, protein_id: int) -> None:
        from openpip import OpenPIP
        try:
            network = OpenPIP().network(protein_id)
            self._network = network
            self.app.call_from_thread(
                self.query_one("#graph", AsciiGraph).render_network, network
            )
        except Exception as e:
            self.app.call_from_thread(
                self.query_one("#graph", AsciiGraph).update,
                f"[red]Error loading network: {e}[/red]"
            )

    def action_focus_export(self) -> None:
        self.query_one("#export-input", Input).focus()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "export-btn":
            path = self.query_one("#export-input", Input).value.strip()
            if path and self._network:
                self._do_export(path)
            elif not path:
                self.query_one("#export-status", Static).update("[yellow]Enter an export path first.[/yellow]")

    @work(thread=True)
    def _do_export(self, path: str) -> None:
        from openpip.export import export_network
        try:
            out = export_network(self._network, path)
            self.app.call_from_thread(
                self.query_one("#export-status", Static).update,
                f"[green]✓ Saved to {out}[/green]"
            )
        except Exception as e:
            self.app.call_from_thread(
                self.query_one("#export-status", Static).update,
                f"[red]Export failed: {e}[/red]"
            )
