import click
from rich.console import Console

console = Console()


@click.group("server")
def server_group():
    """Manage the openPIP server stack (docker compose)."""


@click.group("db")
def db_group():
    """Database management commands."""
