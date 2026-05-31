from textual.app import ComposeResult
from textual.screen import Screen
from textual.widgets import Static, Header, Footer


class ProteinScreen(Screen):
    def compose(self) -> ComposeResult:
        yield Header()
        yield Static("Protein detail screen", classes="panel")
        yield Footer()

    def load_protein(self, protein) -> None:
        pass
