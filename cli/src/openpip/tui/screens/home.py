from textual.app import ComposeResult
from textual.screen import Screen
from textual.widgets import Static, Header, Footer
from textual.containers import Vertical
from textual import work


class HomeScreen(Screen):
    """Home screen — announcements and database statistics."""

    BINDINGS = [("s", "app.push_screen('search')", "Search")]

    def compose(self) -> ComposeResult:
        yield Header()
        with Vertical():
            yield Static("[dim]Loading announcements...[/dim]", id="announcements", classes="panel")
            yield Static("[dim]Loading stats...[/dim]", id="stats", classes="panel")
        yield Footer()

    def on_mount(self) -> None:
        self.load_data()

    @work(thread=True)
    def load_data(self) -> None:
        self._load_announcements()
        self._load_stats()

    def _load_announcements(self) -> None:
        import httpx
        try:
            from openpip.config import get_or_create_config
            cfg = get_or_create_config()
            response = httpx.get(f"{cfg.url.rstrip('/')}/api/announcements/", timeout=5)
            announcements = response.json() if response.status_code == 200 else []
        except Exception:
            announcements = []

        if announcements:
            text = "\n".join(f"[yellow]•[/yellow] {a.get('message','')}" for a in announcements)
        else:
            text = "[dim]No announcements.[/dim]"
        self.app.call_from_thread(
            self.query_one("#announcements", Static).update,
            f"[bold cyan]Announcements[/bold cyan]\n\n{text}"
        )

    def _load_stats(self) -> None:
        import httpx
        try:
            from openpip.config import get_or_create_config
            cfg = get_or_create_config()
            response = httpx.get(f"{cfg.url.rstrip('/')}/api/counts/", timeout=5)
            counts = response.json() if response.status_code == 200 else {}
        except Exception:
            counts = {}

        proteins = counts.get("proteins", "—")
        interactions = counts.get("interactions", "—")
        datasets = counts.get("datasets", "—")

        try:
            proteins_str = f"{proteins:,}" if isinstance(proteins, int) else str(proteins)
            interactions_str = f"{interactions:,}" if isinstance(interactions, int) else str(interactions)
        except Exception:
            proteins_str = str(proteins)
            interactions_str = str(interactions)

        text = (
            f"[bold cyan]Database Statistics[/bold cyan]\n\n"
            f"  [dim]Proteins:[/dim]     [bold]{proteins_str}[/bold]\n"
            f"  [dim]Interactions:[/dim] [bold]{interactions_str}[/bold]\n"
            f"  [dim]Datasets:[/dim]     [bold]{datasets}[/bold]\n\n"
            f"  [bold cyan]s[/bold cyan] search  •  "
            f"[bold cyan]u[/bold cyan] upload  •  "
            f"[bold cyan]q[/bold cyan] quit"
        )
        self.app.call_from_thread(
            self.query_one("#stats", Static).update,
            text
        )
