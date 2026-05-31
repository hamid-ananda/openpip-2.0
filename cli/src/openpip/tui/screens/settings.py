from textual.app import ComposeResult
from textual.screen import Screen
from textual.widgets import Static, Header, Footer


class SettingsScreen(Screen):
    def compose(self) -> ComposeResult:
        yield Header()
        yield Static("Settings screen", classes="panel")
        yield Footer()
