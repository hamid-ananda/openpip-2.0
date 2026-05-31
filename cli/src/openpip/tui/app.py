from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.widgets import Footer, Header


OPENPIP_CSS = """
Screen {
    background: #0f0f1a;
}

Header {
    background: #1a1a2e;
    color: #4cc9f0;
}

Footer {
    background: #1a1a2e;
    color: #aaaaaa;
}

.panel {
    border: solid #2a2a4a;
    padding: 1 2;
}

.title {
    color: #4cc9f0;
    text-style: bold;
}

.muted {
    color: #666666;
}

.success {
    color: #4ade80;
}

.warning {
    color: #facc15;
}

.error {
    color: #f87171;
}
"""


class OpenPIPApp(App):
    """openPIP Terminal User Interface."""

    CSS = OPENPIP_CSS
    TITLE = "openPIP"
    BINDINGS = [
        Binding("q", "quit", "Quit"),
        Binding("s", "push_screen('search')", "Search"),
        Binding("h", "push_screen('home')", "Home"),
        Binding("u", "push_screen('upload')", "Upload"),
    ]

    def on_mount(self) -> None:
        from .screens.home import HomeScreen
        from .screens.search import SearchScreen
        from .screens.protein import ProteinScreen
        from .screens.network import NetworkScreen
        from .screens.upload import UploadScreen
        from .screens.settings import SettingsScreen

        self.install_screen(HomeScreen(), name="home")
        self.install_screen(SearchScreen(), name="search")
        self.install_screen(ProteinScreen(), name="protein")
        self.install_screen(NetworkScreen(), name="network")
        self.install_screen(UploadScreen(), name="upload")
        self.install_screen(SettingsScreen(), name="settings")
        self.push_screen("home")

    def compose(self) -> ComposeResult:
        yield Header()
        yield Footer()


# TODO(phase5): TUI admin panel screens (announcement manager, category manager)
# TODO(phase5): TUI dataset browser (list + download from TUI)
# TODO(phase5): TUI network: clickable nodes navigate to protein detail
# TODO(phase5): TUI: keyboard shortcut for PSICQUIC query
# TODO(phase5): openpip db shell (interactive psql via docker exec)


def launch_tui() -> None:
    app = OpenPIPApp()
    app.run()
