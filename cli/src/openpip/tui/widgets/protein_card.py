from textual.widgets import Static
from openpip.models import Protein


class ProteinCard(Static):
    """Displays a single protein's details as Rich-formatted text."""

    def show(self, protein: Protein) -> None:
        lines = [
            f"[bold cyan]{protein.gene_name or 'Unknown'}[/bold cyan]",
            f"[dim]UniProt:[/dim]  {protein.uniprot_id or '—'}",
            f"[dim]Ensembl:[/dim]  {protein.ensembl_id or '—'}",
            f"[dim]Entrez:[/dim]   {protein.entrez_id or '—'}",
            f"[dim]Interactions:[/dim] {protein.number_of_interactions_in_database or '—'}",
        ]
        if protein.description:
            desc = protein.description[:200]
            if len(protein.description) > 200:
                desc += "..."
            lines.append(f"\n[dim]{desc}[/dim]")
        lines.append(
            f"\n  [bold cyan]↵[/bold cyan] interactions  "
            f"[bold cyan]n[/bold cyan] network"
        )
        self.update("\n".join(lines))

    def clear(self) -> None:
        self.update("[dim]Select a protein to see details.[/dim]")
