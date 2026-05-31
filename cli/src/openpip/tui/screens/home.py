from textual.app import ComposeResult
from textual.screen import Screen
from textual.widgets import Static, Header, Footer


class HomeScreen(Screen):
    def compose(self) -> ComposeResult:
        yield Header()
        yield Static("[bold cyan]openPIP[/bold cyan]\n\nLoading...", classes="panel")
        yield Footer()
