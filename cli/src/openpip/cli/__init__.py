import click
from openpip.config import get_or_create_config
from .commands import (
    search_cmd, protein_cmd, interactions_cmd,
    network_cmd, datasets_cmd, download_cmd, upload_cmd, psicquic_cmd,
)
from .config_cmd import config_group
from .server import server_group, db_group


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
