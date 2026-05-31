from textual.widgets import Static
from openpip.models import NetworkData


class AsciiGraph(Static):
    """Renders a protein network as ASCII adjacency list. Falls back to edge table for large networks."""

    def render_network(self, network: NetworkData) -> None:
        if len(network.nodes) == 0:
            self.update("[dim]No network data.[/dim]")
            return
        if len(network.nodes) > 30:
            self._render_table(network)
        else:
            self._render_ascii(network)

    def _render_table(self, network: NetworkData) -> None:
        lines = [
            f"[bold cyan]Network[/bold cyan] — "
            f"{len(network.nodes)} nodes, {len(network.edges)} edges "
            f"[dim](too large for ASCII — showing top edges)[/dim]\n",
        ]
        edges = sorted(
            network.edges,
            key=lambda e: float(e.data.get("weight", 0)) if e.data.get("weight") else 0,
            reverse=True,
        )
        node_labels = {n.data["id"]: n.data.get("label", n.data["id"]) for n in network.nodes}
        for edge in edges[:20]:
            d = edge.data
            src = node_labels.get(d.get("source", ""), d.get("source", ""))
            tgt = node_labels.get(d.get("target", ""), d.get("target", ""))
            weight = d.get("weight", "")
            lines.append(f"  [cyan]{src}[/cyan] ── [cyan]{tgt}[/cyan]  [dim]{weight}[/dim]")
        if len(network.edges) > 20:
            lines.append(f"\n  [dim]...and {len(network.edges) - 20} more. Use export to save all.[/dim]")
        lines.append("\n  [dim]Type a path and press Export to save as image or data file.[/dim]")
        self.update("\n".join(lines))

    def _render_ascii(self, network: NetworkData) -> None:
        import networkx as nx
        G = nx.Graph()
        node_labels = {}
        for node in network.nodes:
            nid = node.data["id"]
            label = node.data.get("label", nid)[:8]
            G.add_node(nid)
            node_labels[nid] = label

        for edge in network.edges:
            d = edge.data
            G.add_edge(d.get("source"), d.get("target"))

        lines = [
            f"[bold cyan]Network[/bold cyan] — "
            f"{len(network.nodes)} nodes, {len(network.edges)} edges\n"
        ]
        for node in list(G.nodes)[:15]:
            label = node_labels.get(node, node)
            neighbors = list(G.neighbors(node))[:4]
            if neighbors:
                neighbor_str = " ── ".join(
                    f"[cyan]{node_labels.get(n, n)}[/cyan]" for n in neighbors
                )
                lines.append(f"  [bold cyan]{label}[/bold cyan] ── {neighbor_str}")
            else:
                lines.append(f"  [bold cyan]{label}[/bold cyan]")

        if len(network.nodes) > 15:
            lines.append(f"\n  [dim]...and {len(network.nodes) - 15} more nodes[/dim]")
        lines.append("\n  [dim]Type a path below and press Export to save.[/dim]")
        self.update("\n".join(lines))
