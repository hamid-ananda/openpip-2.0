import sys
import click
from rich.console import Console
from openpip.config import get_or_create_config
from openpip.exceptions import NotFound, AuthRequired, ServerError, OpenPIPError
from .commands import (
    search_cmd, protein_cmd, interactions_cmd,
    network_cmd, datasets_cmd, download_cmd, upload_cmd, psicquic_cmd,
)
from .config_cmd import config_group
from .server import server_group, db_group

_err = Console(stderr=True)


@click.group(invoke_without_command=True)
@click.pass_context
def main(ctx: click.Context):
    """openPIP — protein interaction database CLI.

    Run with no arguments to launch the interactive TUI.
    """
    if ctx.invoked_subcommand is None:
        cfg = get_or_create_config()
        if cfg.interface == "tui":
            try:
                from openpip.tui.app import launch_tui
                launch_tui()
            except ImportError:
                click.echo(ctx.get_help())
        else:
            click.echo(ctx.get_help())


def _handle_error(e: Exception) -> None:
    msg = str(e)
    # Strip the full URL from "Resource not found: https://..." — keep only the path
    if "Resource not found: " in msg:
        url_part = msg.split("Resource not found: ", 1)[1]
        try:
            from urllib.parse import urlparse
            path = urlparse(url_part).path
            msg = f"'{path}' not found"
        except Exception:
            pass

    if isinstance(e, NotFound):
        _err.print(f"[bold red]Not found:[/bold red] {msg}")
    elif isinstance(e, AuthRequired):
        _err.print(f"[bold yellow]Auth required:[/bold yellow] {msg}")
        _err.print("[dim]Run [bold]openpip config set url <url>[/bold] or provide credentials.[/dim]")
    elif isinstance(e, ServerError):
        _err.print(f"[bold red]Server error:[/bold red] {msg}")
    elif isinstance(e, OpenPIPError):
        _err.print(f"[bold red]Error:[/bold red] {msg}")
    else:
        raise e
    sys.exit(1)


# Wrap every subcommand to catch OpenPIPError cleanly
class _ErrorHandlingGroup(click.Group):
    def invoke(self, ctx: click.Context):
        try:
            return super().invoke(ctx)
        except OpenPIPError as e:
            _handle_error(e)


main.__class__ = _ErrorHandlingGroup


main.add_command(search_cmd, "search")
main.add_command(protein_cmd, "protein")
main.add_command(interactions_cmd, "interactions")
main.add_command(network_cmd, "network")
main.add_command(datasets_cmd, "datasets")
main.add_command(download_cmd, "download")
main.add_command(upload_cmd, "upload")
main.add_command(psicquic_cmd, "psicquic")
main.add_command(config_group, "config")
main.add_command(server_group, "server")
main.add_command(db_group, "db")
