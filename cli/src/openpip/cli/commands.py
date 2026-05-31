import click
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from openpip.sdk import OpenPIP
from openpip.config import get_or_create_config, save_config
from .formatters import (
    print_protein_table, print_protein_detail,
    print_interaction_table, print_dataset_table, console,
)


def _sdk() -> OpenPIP:
    cfg = get_or_create_config()
    return OpenPIP(url=cfg.url, token=cfg.token)


@click.command("search")
@click.argument("query")
def search_cmd(query: str):
    """Search proteins by gene name, UniProt ID, or Ensembl ID."""
    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"),
                  transient=True) as progress:
        progress.add_task(f"Searching for {query}...", total=None)
        results = _sdk().search(query)
    print_protein_table(results, query)


@click.command("protein")
@click.argument("protein_id", type=int)
def protein_cmd(protein_id: int):
    """Get full protein detail by ID."""
    result = _sdk().protein(protein_id)
    print_protein_detail(result)


@click.command("interactions")
@click.argument("protein_id", type=int)
def interactions_cmd(protein_id: int):
    """List all interactions for a protein."""
    results = _sdk().interactions(protein_id)
    print_interaction_table(results)


@click.command("network")
@click.argument("protein_id", type=int)
@click.option("--export", "export_path", default=None, help="Save to file (e.g. graph.png, network.graphml)")
@click.option("--renderer", default="auto", type=click.Choice(["auto", "cytoscape", "matplotlib"]))
def network_cmd(protein_id: int, export_path, renderer: str):
    """View or export a protein interaction network."""
    sdk = _sdk()
    if export_path:
        with Progress(SpinnerColumn(), TextColumn("{task.description}"), transient=True) as p:
            p.add_task("Exporting network...", total=None)
            from openpip.export import export_network
            network = sdk.network(protein_id)
            out = export_network(network, export_path, renderer=renderer)
        console.print(f"[green]✓[/green] Saved to [cyan]{out}[/cyan]")
    else:
        network = sdk.network(protein_id)
        _print_ascii_network(network)


def _print_ascii_network(network) -> None:
    from rich.table import Table as RichTable
    table = RichTable(
        title=f"Network ({len(network.nodes)} nodes, {len(network.edges)} edges)",
        header_style="bold cyan"
    )
    table.add_column("Source")
    table.add_column("Target")
    table.add_column("Weight", justify="right")
    for edge in network.edges[:50]:
        d = edge.data
        table.add_row(str(d.get("source", "-")), str(d.get("target", "-")), str(d.get("weight", "-")))
    if len(network.edges) > 50:
        console.print(f"[dim]Showing 50 of {len(network.edges)} edges. Use --export to save all.[/dim]")
    console.print(table)


@click.command("datasets")
def datasets_cmd():
    """List all available datasets."""
    results = _sdk().datasets()
    print_dataset_table(results)


@click.command("download")
@click.argument("dataset_id", type=int)
@click.option("--output", "-o", default=None, help="Output file path")
def download_cmd(dataset_id: int, output):
    """Download a dataset file."""
    with Progress(SpinnerColumn(), TextColumn("{task.description}"), transient=True) as p:
        p.add_task(f"Downloading dataset {dataset_id}...", total=None)
        path = _sdk().download(dataset_id, path=output)
    console.print(f"[green]✓[/green] Saved to [cyan]{path}[/cyan]")


@click.command("upload")
@click.argument("file_path")
@click.option("--name", required=True, help="Dataset name")
def upload_cmd(file_path: str, name: str):
    """Upload a PSI-MI TAB dataset (admin only)."""
    cfg = get_or_create_config()
    if not cfg.token:
        import getpass
        username = click.prompt("Username")
        password = getpass.getpass("Password: ")
        from openpip.auth import fetch_token
        token = fetch_token(cfg.url, username, password)
        sdk = OpenPIP(url=cfg.url, token=token)
    else:
        sdk = OpenPIP(url=cfg.url, token=cfg.token)
    result = sdk.upload(file_path, name)
    console.print(f"[green]✓[/green] Uploaded: {result}")


@click.command("psicquic")
@click.argument("query")
@click.option("--format", "fmt", default="tab25", type=click.Choice(["tab25", "json"]))
@click.option("--max-results", default=200, type=int)
def psicquic_cmd(query: str, fmt: str, max_results: int):
    """PSICQUIC MIQL query (e.g. 'BRCA1', 'idA:P38398')."""
    result = _sdk().psicquic(query, format=fmt, max_results=max_results)
    if isinstance(result, list):
        import json
        console.print_json(json.dumps(result))
    else:
        console.print(result)
