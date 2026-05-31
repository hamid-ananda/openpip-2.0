from textual.app import ComposeResult
from textual.screen import Screen
from textual.widgets import Input, Button, Static, Header, Footer
from textual.containers import Vertical
from textual.binding import Binding
from textual import work


class UploadScreen(Screen):
    """Dataset upload screen — admin credentials required."""

    BINDINGS = [Binding("escape", "app.pop_screen()", "Back")]

    def compose(self) -> ComposeResult:
        yield Header()
        with Vertical(classes="panel"):
            yield Static("[bold cyan]Upload Dataset[/bold cyan]\n[dim]Admin credentials required.[/dim]\n")
            yield Input(placeholder="File path (e.g. /home/user/data.tab)", id="file-input")
            yield Input(placeholder="Dataset name", id="name-input")
            yield Input(placeholder="Admin username", id="username-input")
            yield Input(placeholder="Admin password", password=True, id="password-input")
            yield Button("Upload", id="upload-btn", variant="primary")
            yield Static("", id="upload-status")
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "upload-btn":
            file_path = self.query_one("#file-input", Input).value.strip()
            name = self.query_one("#name-input", Input).value.strip()
            username = self.query_one("#username-input", Input).value.strip()
            password = self.query_one("#password-input", Input).value.strip()
            if not all([file_path, name, username, password]):
                self.query_one("#upload-status", Static).update("[red]All fields are required.[/red]")
                return
            self._do_upload(file_path, name, username, password)

    @work(thread=True)
    def _do_upload(self, file_path: str, name: str, username: str, password: str) -> None:
        from openpip import OpenPIP
        from openpip.config import get_or_create_config
        self.app.call_from_thread(
            self.query_one("#upload-status", Static).update,
            "[yellow]Uploading...[/yellow]"
        )
        try:
            cfg = get_or_create_config()
            sdk = OpenPIP(url=cfg.url, username=username, password=password)
            sdk.upload(file_path, name)
            self.app.call_from_thread(
                self.query_one("#upload-status", Static).update,
                "[green]✓ Upload complete.[/green]"
            )
        except Exception as e:
            self.app.call_from_thread(
                self.query_one("#upload-status", Static).update,
                f"[red]Upload failed: {e}[/red]"
            )
