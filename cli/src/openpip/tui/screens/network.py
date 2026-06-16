from __future__ import annotations
import subprocess
import sys
import tempfile
from pathlib import Path
from textual.app import ComposeResult
from textual.screen import Screen
from textual.widgets import Static, Header, Footer, Input, Button, Select
from textual.containers import Vertical, Horizontal
from textual.binding import Binding
from textual import work
from openpip.models import Protein, NetworkData


LAYOUTS = [
    ("Force-directed", "cose"),
    ("Concentric", "concentric"),
    ("Circle", "circle"),
    ("Grid", "grid"),
]

NETWORK_CSS = """
NetworkScreen #summary {
    height: 1fr;
    overflow: auto auto;
    padding: 1 2;
}
NetworkScreen #controls {
    height: 3;
    padding: 0 1;
}
NetworkScreen #export-bar {
    height: 3;
    padding: 0 1;
}
NetworkScreen #export-status {
    height: 1;
    padding: 0 1;
}
NetworkScreen Select {
    width: 22;
}
"""


def _open_image(path: Path) -> None:
    """Open image in the system viewer."""
    if sys.platform == "darwin":
        subprocess.Popen(["open", str(path)])
    else:
        subprocess.Popen(["xdg-open", str(path)], stdout=subprocess.DEVNULL,
                         stderr=subprocess.DEVNULL)


class NetworkScreen(Screen):
    """Network screen — opens graph in system viewer, shows stats in TUI."""

    CSS = NETWORK_CSS

    BINDINGS = [
        Binding("escape", "app.pop_screen()", "Back"),
        Binding("e", "focus_export", "Export"),
        Binding("o", "open_graph", "Open graph"),
    ]

    def __init__(self):
        super().__init__()
        self._protein: Protein | None = None
        self._network: NetworkData | None = None
        self._layout: str = "cose"
        self._tmp: Path | None = None

    def compose(self) -> ComposeResult:
        yield Header()
        with Vertical():
            with Horizontal(id="controls"):
                yield Select(options=LAYOUTS, value="cose", id="layout-select", allow_blank=False)
                yield Button("Open graph  o", id="open-btn", variant="success")
            yield Static("[dim]Select a protein and press n to view its network.[/dim]",
                         id="summary", classes="panel")
            with Horizontal(id="export-bar"):
                yield Input(placeholder="Save to file — e.g. graph.png, network.graphml, edges.tsv",
                            id="export-input")
                yield Button("Save  e", id="export-btn", variant="primary")
            yield Static("", id="export-status")
        yield Footer()

    def load_network(self, protein: Protein) -> None:
        self._protein = protein
        identifier = protein.gene_name or protein.uniprot_id
        if self.is_attached:
            self.sub_title = f"Network: {identifier}"
            self._fetch_network(identifier)

    def on_mount(self) -> None:
        if self._protein:
            identifier = self._protein.gene_name or self._protein.uniprot_id
            self.sub_title = f"Network: {identifier}"
            self._fetch_network(identifier)

    def on_select_changed(self, event: Select.Changed) -> None:
        if event.select.id == "layout-select":
            self._layout = str(event.value)

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "open-btn":
            self.action_open_graph()
        elif event.button.id == "export-btn":
            path = self.query_one("#export-input", Input).value.strip()
            if path and self._network:
                self._do_export(path)
            elif not path:
                self.query_one("#export-status", Static).update(
                    "[yellow]Enter a file path first.[/yellow]"
                )

    def action_open_graph(self) -> None:
        if self._network:
            self._generate_and_open(self._network)
        else:
            self.query_one("#export-status", Static).update(
                "[yellow]No network loaded yet.[/yellow]"
            )

    def action_focus_export(self) -> None:
        self.query_one("#export-input", Input).focus()

    @work(thread=True)
    def _fetch_network(self, identifier: str) -> None:
        from openpip import OpenPIP
        self.app.call_from_thread(
            self.query_one("#summary", Static).update,
            "[dim]Fetching network...[/dim]",
        )
        try:
            network = OpenPIP().network(identifier)
            self._network = network
            self.app.call_from_thread(self._show_summary, network)
        except Exception as e:
            self.app.call_from_thread(
                self.query_one("#summary", Static).update,
                f"[red]Error: {e}[/red]",
            )

    def _show_summary(self, network: NetworkData) -> None:
        id_to_label = {n.data["id"]: n.data.get("label", n.data["id"]) for n in network.nodes}
        query_ids = {n.data["id"] for n in network.nodes if n.data.get("is_query")}
        query_names = ", ".join(id_to_label.get(q, q) for q in query_ids)

        lines = [
            f"[bold cyan]{query_names or 'Network'}[/bold cyan]  "
            f"[dim]{len(network.nodes)} proteins · {len(network.edges)} interactions[/dim]\n",
            f"  Press [bold cyan]o[/bold cyan] to open the full graph in your image viewer.\n",
            "",
            "  [bold]Top interactions:[/bold]",
        ]

        # Sort edges: put query-involving edges first
        def edge_rank(e):
            s, t = e.data.get("source"), e.data.get("target")
            return (0 if (s in query_ids or t in query_ids) else 1,
                    -(float(e.data.get("weight") or 0)))

        shown = 0
        for edge in sorted(network.edges, key=edge_rank):
            d = edge.data
            src = id_to_label.get(d.get("source", ""), "?")
            tgt = id_to_label.get(d.get("target", ""), "?")
            if src == tgt:
                continue
            src_fmt = f"[bold red]{src}[/bold red]" if d.get("source") in query_ids else f"[cyan]{src}[/cyan]"
            tgt_fmt = f"[bold red]{tgt}[/bold red]" if d.get("target") in query_ids else f"[cyan]{tgt}[/cyan]"
            score = d.get("weight")
            score_str = f"  [dim]{float(score):.3f}[/dim]" if score else ""
            lines.append(f"    {src_fmt} ── {tgt_fmt}{score_str}")
            shown += 1
            if shown >= 30:
                remaining = len(network.edges) - shown
                if remaining > 0:
                    lines.append(f"\n    [dim]... and {remaining} more · press o to see the full graph[/dim]")
                break

        self.query_one("#summary", Static).update("\n".join(lines))

    @work(thread=True)
    def _generate_and_open(self, network: NetworkData) -> None:
        self.app.call_from_thread(
            self.query_one("#export-status", Static).update,
            "[dim]Generating graph...[/dim]",
        )
        try:
            from openpip.export import _export_matplotlib
            tmp = Path(tempfile.mktemp(suffix=".png"))
            _export_matplotlib(network, tmp, ".png", layout=self._layout,
                                figsize=(16, 12))
            self._tmp = tmp
            _open_image(tmp)
            self.app.call_from_thread(
                self.query_one("#export-status", Static).update,
                f"[green]✓ Graph opened in image viewer[/green]  [dim]{tmp}[/dim]",
            )
        except Exception as e:
            self.app.call_from_thread(
                self.query_one("#export-status", Static).update,
                f"[red]Failed to open graph: {e}[/red]",
            )

    @work(thread=True)
    def _do_export(self, path: str) -> None:
        from openpip.export import export_network
        try:
            out = export_network(self._network, path, layout=self._layout)
            self.app.call_from_thread(
                self.query_one("#export-status", Static).update,
                f"[green]✓ Saved to {out}[/green]",
            )
        except Exception as e:
            self.app.call_from_thread(
                self.query_one("#export-status", Static).update,
                f"[red]Export failed: {e}[/red]",
            )
