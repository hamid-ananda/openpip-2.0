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
    """Search proteins by gene name, UniProt ID, or Ensembl ID. Separate multiple with commas."""
    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"),
                  transient=True) as progress:
        progress.add_task(f"Searching for {query}...", total=None)
        data = _sdk().search_full(query)
    _print_search_results(data, query)


@click.command("protein")
@click.argument("identifier")
def protein_cmd(identifier: str):
    """Get full protein detail by gene name, UniProt ID, or Ensembl ID."""
    result = _sdk().protein(identifier)
    print_protein_detail(result)


@click.command("interactions")
@click.argument("identifier")
def interactions_cmd(identifier: str):
    """List all interactions for a protein (gene name or UniProt ID)."""
    results = _sdk().interactions(identifier)
    print_interaction_table(results)


@click.command("network")
@click.argument("identifier")
@click.option("--export", "export_path", default=None, help="Save to file (e.g. graph.png, network.graphml)")
@click.option("--layout", default="cose",
              type=click.Choice(["cose", "cola", "concentric", "circle", "grid"]),
              help="Graph layout algorithm (default: cose)")
@click.option("--renderer", default="auto", type=click.Choice(["auto", "cytoscape", "matplotlib"]))
def network_cmd(identifier: str, export_path, layout: str, renderer: str):
    """View or export a protein interaction network."""
    sdk = _sdk()
    if export_path:
        with Progress(SpinnerColumn(), TextColumn("{task.description}"), transient=True) as p:
            p.add_task("Exporting network...", total=None)
            from openpip.export import export_network
            network = sdk.network(identifier)
            out = export_network(network, export_path, renderer=renderer, layout=layout)
        console.print(f"[green]✓[/green] Saved to [cyan]{out}[/cyan]")
    else:
        network = sdk.network(identifier)
        _print_ascii_network(network)


def _print_search_results(data: dict, query: str) -> None:
    from rich.table import Table as RichTable
    from collections import defaultdict

    proteins = data.get("all_proteins", [])
    interactions = data.get("all_interactions", [])
    query_ids = set(data.get("query_protein_id_array", []))

    if not proteins:
        console.print(f"[yellow]No results found for '{query}'.[/yellow]")
        return

    terms = [t.strip() for t in query.split(",") if t.strip()]
    not_found = data.get("unfound_protein_summary", "").replace("<br>", ", ").strip(", ")
    is_multi = len(query_ids) > 1

    # Build map: protein_id → ordered query label (gene name or uniprot)
    query_label: dict[int, str] = {}
    for p in proteins:
        if p["protein_id"] in query_ids:
            query_label[p["protein_id"]] = (
                p.get("protein_gene_name") or p.get("protein_uniprot_id", str(p["protein_id"]))
            )
    # Keep query labels in a stable order matching query_protein_id_array
    ordered_queries = [
        query_label[qid]
        for qid in data.get("query_protein_id_array", [])
        if qid in query_label
    ]

    # Build map: protein_id → set of query labels it directly connects to
    connects: dict[int, set[str]] = defaultdict(set)
    for i in interactions:
        a_id = i["interactor_A"]["protein_id"]
        b_id = i["interactor_B"]["protein_id"]
        if a_id in query_ids:
            connects[b_id].add(query_label[a_id])
        if b_id in query_ids:
            connects[a_id].add(query_label[b_id])
    for qid, label in query_label.items():
        connects[qid].add(label)

    title = "Search Results"
    if len(terms) == 1:
        title += f' for "{terms[0]}"'
    else:
        title += f' for {", ".join(terms)}'

    table = RichTable(title=title, show_header=True, header_style="bold cyan")
    table.add_column("Gene Name", style="bold")
    table.add_column("UniProt ID", style="cyan")
    if is_multi:
        for label in ordered_queries:
            table.add_column(label, justify="center")
    table.add_column("Interactions", justify="right")

    # Sort: query proteins first, then by number of query connections desc, then alphabetical
    def sort_key(p):
        pid = p["protein_id"]
        is_query = pid in query_ids
        n_shared = len(connects.get(pid, set()))
        gene = p.get("protein_gene_name") or ""
        return (0 if is_query else 1, -n_shared, gene)

    for p in sorted(proteins, key=sort_key):
        pid = p["protein_id"]
        gene = p.get("protein_gene_name") or "-"
        uniprot = p.get("protein_uniprot_id") or "-"
        n_int = str(p.get("number_of_interactions_in_database") or "-")

        if is_multi:
            linked = connects.get(pid, set())
            marks = [
                "[bold green]✓[/bold green]" if label in linked else "[dim]·[/dim]"
                for label in ordered_queries
            ]
            table.add_row(gene, uniprot, *marks, n_int)
        else:
            table.add_row(gene, uniprot, n_int)

    console.print(table)

    if is_multi:
        n_shared = sum(
            1 for p in proteins
            if p["protein_id"] not in query_ids and len(connects.get(p["protein_id"], set())) == len(query_ids)
        )
        counts = " · ".join(
            f"{sum(1 for p in proteins if p['protein_id'] not in query_ids and label in connects.get(p['protein_id'], set()))}"
            f" {label}-only"
            for label in ordered_queries
        )
        console.print(f"[dim]{n_shared} shared · {counts}[/dim]")
    if not_found:
        console.print(f"[yellow]Not found:[/yellow] {not_found}")


def _print_ascii_network(network) -> None:
    from rich.table import Table as RichTable

    id_to_label = {n.data["id"]: n.data.get("label") or n.data["id"] for n in network.nodes}

    table = RichTable(
        title=f"Network — {len(network.nodes)} proteins, {len(network.edges)} interactions",
        header_style="bold cyan",
    )
    table.add_column("Protein A", style="bold")
    table.add_column("Protein B", style="bold")
    table.add_column("Score", justify="right")

    for edge in network.edges[:50]:
        d = edge.data
        src = id_to_label.get(str(d.get("source", "")), str(d.get("source", "-")))
        tgt = id_to_label.get(str(d.get("target", "")), str(d.get("target", "-")))
        weight = d.get("weight")
        weight_str = f"{float(weight):.3f}" if weight else "[dim]—[/dim]"
        table.add_row(src, tgt, weight_str)

    console.print(table)
    if len(network.edges) > 50:
        console.print(f"[dim]Showing 50 of {len(network.edges)} interactions · use --export to save all[/dim]")


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
