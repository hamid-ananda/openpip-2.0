from textual.app import ComposeResult
from textual.screen import Screen
from textual.widgets import Input, Button, Static, Header, Footer, RadioSet, RadioButton
from textual.containers import Vertical, Horizontal
from textual.binding import Binding


class SettingsScreen(Screen):
    """Settings screen — URL, interface preference, auth status."""

    BINDINGS = [Binding("escape", "app.pop_screen()", "Back")]

    def compose(self) -> ComposeResult:
        from openpip.config import get_or_create_config
        cfg = get_or_create_config()

        yield Header()
        with Vertical(classes="panel"):
            yield Static("[bold cyan]Settings[/bold cyan]\n")
            yield Static("[dim]Server URL[/dim]")
            yield Input(value=cfg.url, id="url-input")
            yield Static("\n[dim]Default Interface[/dim]")
            with RadioSet(id="interface-radio"):
                yield RadioButton("TUI — interactive terminal UI", value=(cfg.interface == "tui"))
                yield RadioButton("Rich — formatted output (scriptable)", value=(cfg.interface == "rich"))
            yield Static(
                f"\n[dim]Username:[/dim] {cfg.username or '[dim]not set[/dim]'}\n"
                f"[dim]Token:[/dim]    {'[green]stored[/green]' if cfg.token else '[dim]not stored[/dim]'}"
            )
            with Horizontal():
                yield Button("Save", id="save-btn", variant="primary")
                yield Button("Cancel", id="cancel-btn")
            yield Static("", id="settings-status")
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "cancel-btn":
            self.app.pop_screen()
        elif event.button.id == "save-btn":
            self._save()

    def _save(self) -> None:
        from openpip.config import get_or_create_config, save_config
        cfg = get_or_create_config()
        cfg.url = self.query_one("#url-input", Input).value.strip()
        radio_set = self.query_one("#interface-radio", RadioSet)
        cfg.interface = "tui" if radio_set.pressed_index == 0 else "rich"
        save_config(cfg)
        self.query_one("#settings-status", Static).update("[green]✓ Settings saved.[/green]")
