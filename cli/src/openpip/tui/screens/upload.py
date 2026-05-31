from textual.app import ComposeResult
from textual.screen import Screen
from textual.widgets import Static, Header, Footer


class UploadScreen(Screen):
    def compose(self) -> ComposeResult:
        yield Header()
        yield Static("Upload screen", classes="panel")
        yield Footer()
