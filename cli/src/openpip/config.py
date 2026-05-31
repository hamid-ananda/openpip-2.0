from __future__ import annotations
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional
import yaml

DEFAULT_URL = "https://openpip.usask.ca"
DEFAULT_CONFIG_PATH = Path.home() / ".openpip" / "config.yaml"


@dataclass
class Config:
    url: str = DEFAULT_URL
    interface: str = "tui"
    username: Optional[str] = None
    token: Optional[str] = None
    refresh_token: Optional[str] = None


def load_config(path: Path = DEFAULT_CONFIG_PATH) -> Optional[Config]:
    if not path.exists():
        return None
    with path.open() as f:
        data = yaml.safe_load(f) or {}
    return Config(**{k: v for k, v in data.items() if k in Config.__dataclass_fields__})


def save_config(cfg: Config, path: Path = DEFAULT_CONFIG_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as f:
        yaml.dump(asdict(cfg), f, default_flow_style=False)


def run_first_run_wizard() -> Config:
    from rich.console import Console
    from rich.prompt import Prompt, Confirm

    console = Console()
    console.print("\n[bold cyan]Welcome to openPIP CLI![/bold cyan]\n")
    url = Prompt.ask("  Server URL", default=DEFAULT_URL)

    console.print("\n  Choose your default interface:")
    console.print("    [bold]1.[/bold] TUI  — interactive terminal UI")
    console.print("    [bold]2.[/bold] Rich — formatted output (scriptable)")
    choice = Prompt.ask("  Interface", choices=["1", "2"], default="1")
    interface = "tui" if choice == "1" else "rich"

    is_local = url.startswith("http://localhost") or url.startswith("http://127.0.0.1")
    username = None
    token = None

    if is_local:
        console.print("\n  [yellow]Local instance detected.[/yellow] Enter admin credentials (optional).")
        if Confirm.ask("  Store admin credentials?", default=True):
            username = Prompt.ask("  Username")
            from openpip.auth import fetch_token
            import getpass
            password = getpass.getpass("  Password: ")
            try:
                token = fetch_token(url, username, password)
                console.print("  [green]✓ Authenticated successfully.[/green]")
            except Exception:
                console.print("  [red]Could not authenticate — credentials not stored.[/red]")
                username = None

    cfg = Config(url=url, interface=interface, username=username, token=token)
    save_config(cfg)
    console.print(f"\n  Config saved to [dim]~/.openpip/config.yaml[/dim]\n")
    return cfg


def get_or_create_config() -> Config:
    cfg = load_config()
    if cfg is None:
        cfg = run_first_run_wizard()
    return cfg
