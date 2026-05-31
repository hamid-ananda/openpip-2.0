from textual.app import ComposeResult
from textual.screen import Screen
from textual.widgets import Static, Header, Footer


class NetworkScreen(Screen):
    def compose(self) -> ComposeResult:
        yield Header()
        yield Static("Network screen", classes="panel")
        yield Footer()

    def load_network(self, protein) -> None:
        pass
