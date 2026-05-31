from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from openpip.models import Protein, Interaction, Dataset

console = Console()


def print_protein_table(proteins: list[Protein], query: str = "") -> None:
    if not proteins:
        console.print(f"[yellow]No results found for '{query}'.[/yellow]")
        return
    title = "Protein Search Results" + (f' for "{query}"' if query else "")
    table = Table(title=title, show_header=True, header_style="bold cyan")
    table.add_column("ID", style="dim", width=6)
    table.add_column("Gene Name", style="bold")
    table.add_column("UniProt ID", style="cyan")
    table.add_column("Interactions", justify="right")
    for p in proteins:
        table.add_row(
            str(p.id),
            p.gene_name or "-",
            p.uniprot_id or "-",
            str(p.number_of_interactions_in_database or "-"),
        )
    console.print(table)


def print_protein_detail(protein: Protein) -> None:
    lines = [
        f"[bold cyan]{protein.gene_name or 'Unknown'}[/bold cyan]",
        f"[dim]UniProt:[/dim] {protein.uniprot_id or '-'}",
        f"[dim]Ensembl:[/dim] {protein.ensembl_id or '-'}",
        f"[dim]Entrez:[/dim]  {protein.entrez_id or '-'}",
        f"[dim]Interactions:[/dim] {protein.number_of_interactions_in_database or '-'}",
    ]
    if protein.description:
        lines.append(f"\n{protein.description}")
    console.print(Panel("\n".join(lines), title="Protein Detail", border_style="cyan"))


def print_interaction_table(interactions: list[Interaction]) -> None:
    if not interactions:
        console.print("[yellow]No interactions found.[/yellow]")
        return
    table = Table(title=f"Interactions ({len(interactions)})", header_style="bold cyan")
    table.add_column("ID", style="dim", width=6)
    table.add_column("Interactor A", style="bold")
    table.add_column("Interactor B", style="bold")
    table.add_column("Score", justify="right")
    for i in interactions:
        score = i.score or "-"
        try:
            bar = "█" * int(float(score) * 5) + "░" * (5 - int(float(score) * 5))
            score_str = f"{bar} {score}"
        except (ValueError, TypeError):
            score_str = score
        table.add_row(
            str(i.id),
            i.interactor_A.gene_name or i.interactor_A.uniprot_id or "-",
            i.interactor_B.gene_name or i.interactor_B.uniprot_id or "-",
            score_str,
        )
    console.print(table)


def print_dataset_table(datasets: list[Dataset]) -> None:
    if not datasets:
        console.print("[yellow]No datasets available.[/yellow]")
        return
    table = Table(title="Datasets", header_style="bold cyan")
    table.add_column("ID", style="dim", width=6)
    table.add_column("Name", style="bold")
    table.add_column("Author")
    table.add_column("Year", width=6)
    table.add_column("Interactions", justify="right")
    for d in datasets:
        table.add_row(
            str(d.id),
            d.name or "-",
            d.author or "-",
            d.year or "-",
            str(d.number_of_interactions or "-"),
        )
    console.print(table)
