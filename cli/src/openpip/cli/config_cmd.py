import click
from rich.console import Console
from openpip.config import get_or_create_config, save_config, DEFAULT_CONFIG_PATH

console = Console()


@click.group("config")
def config_group():
    """View and update CLI configuration."""


@config_group.command("show")
def config_show():
    """Show current configuration."""
    cfg = get_or_create_config()
    console.print(f"[bold]URL:[/bold]        {cfg.url}")
    console.print(f"[bold]Interface:[/bold]  {cfg.interface}")
    console.print(f"[bold]Username:[/bold]   {cfg.username or '[dim]not set[/dim]'}")
    console.print(f"[bold]Token:[/bold]      {'[green]stored[/green]' if cfg.token else '[dim]not set[/dim]'}")
    console.print(f"[bold]Config file:[/bold] {DEFAULT_CONFIG_PATH}")


@config_group.command("set")
@click.argument("key", type=click.Choice(["interface", "url"]))
@click.argument("value")
def config_set(key: str, value: str):
    """Set a configuration value."""
    cfg = get_or_create_config()
    if key == "interface" and value not in ("tui", "rich"):
        raise click.BadParameter("interface must be 'tui' or 'rich'")
    setattr(cfg, key, value)
    save_config(cfg)
    console.print(f"[green]✓[/green] Set {key} = {value}")
