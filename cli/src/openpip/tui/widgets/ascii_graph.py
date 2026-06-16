from __future__ import annotations
import math
from textual.widgets import Static
from openpip.models import NetworkData


def _bresenham(grid: list[list[str]], x0: int, y0: int, x1: int, y1: int, w: int, h: int) -> None:
    dx, dy = abs(x1 - x0), abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx - dy
    while True:
        if 0 <= x0 < w and 0 <= y0 < h and grid[y0][x0] == " ":
            grid[y0][x0] = "·"
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 > -dy:
            err -= dy
            x0 += sx
        if e2 < dx:
            err += dx
            y0 += sy


class AsciiGraph(Static):
    """Renders a protein interaction network as a 2D ASCII canvas."""

    def render_network(self, network: NetworkData, width: int = 76, height: int = 22) -> None:
        if not network.nodes:
            self.update("[dim]No network data.[/dim]")
            return

        try:
            import networkx as nx
        except ImportError:
            self._render_fallback(network)
            return

        # Build graph
        G = nx.Graph()
        node_labels: dict[str, str] = {}
        query_ids: set[str] = set()

        for node in network.nodes:
            nid = node.data["id"]
            G.add_node(nid)
            node_labels[nid] = (node.data.get("label") or nid)[:12]
            if node.data.get("is_query"):
                query_ids.add(nid)

        for edge in network.edges:
            d = edge.data
            s, t = d.get("source"), d.get("target")
            if s and t and s != t and G.has_node(s) and G.has_node(t):
                G.add_edge(s, t)

        # Spring layout — seed query nodes near center
        pos_init: dict[str, tuple[float, float]] = {}
        query_list = list(query_ids)
        non_query = [n for n in G.nodes if n not in query_ids]
        for i, q in enumerate(query_list):
            angle = 2 * math.pi * i / max(len(query_list), 1)
            pos_init[q] = (0.05 * math.cos(angle), 0.05 * math.sin(angle))
        for i, n in enumerate(non_query):
            angle = 2 * math.pi * i / max(len(non_query), 1)
            pos_init[n] = (math.cos(angle), math.sin(angle))

        pos = nx.spring_layout(G, pos=pos_init, seed=42, iterations=80, k=2.0)

        # Map layout coords to character grid
        xs = [v[0] for v in pos.values()]
        ys = [v[1] for v in pos.values()]
        xmin, xmax = min(xs), max(xs)
        ymin, ymax = min(ys), max(ys)
        xr = (xmax - xmin) or 1
        yr = (ymax - ymin) or 1
        pad_x, pad_y = 8, 2

        def to_grid(x: float, y: float) -> tuple[int, int]:
            gx = int(pad_x + (x - xmin) / xr * (width - 2 * pad_x))
            gy = int(pad_y + (y - ymin) / yr * (height - 2 * pad_y))
            return gx, gy

        node_pos = {nid: to_grid(*pos[nid]) for nid in G.nodes}

        # Character canvas
        grid = [[" "] * width for _ in range(height)]

        # Draw edges first (labels overwrite dots)
        for u, v in G.edges():
            x0, y0 = node_pos[u]
            x1, y1 = node_pos[v]
            _bresenham(grid, x0, y0, x1, y1, width, height)

        # Draw node labels
        for nid, (gx, gy) in node_pos.items():
            raw = node_labels.get(nid, nid)
            display = f"[{raw}]" if nid in query_ids else raw
            sx = max(0, gx - len(display) // 2)
            for i, ch in enumerate(display):
                px = sx + i
                if 0 <= px < width and 0 <= gy < height:
                    grid[gy][px] = ch

        # Trim trailing whitespace and empty lines
        canvas_lines = ["".join(row).rstrip() for row in grid]
        while canvas_lines and not canvas_lines[-1].strip():
            canvas_lines.pop()

        query_names = ", ".join(node_labels.get(q, q) for q in query_ids)
        header = (
            f"[bold cyan]Network[/bold cyan] — "
            f"[bold]{len(network.nodes)}[/bold] proteins · "
            f"[bold]{len(network.edges)}[/bold] interactions"
        )
        if query_names:
            header += f"  [dim]query: {query_names}[/dim]"

        legend = "  [bold cyan][[name]][/bold cyan] query protein   [dim]·[/dim] interaction"
        footer = "[dim]e export  ·  esc back[/dim]"

        self.update(f"{header}\n{legend}\n\n" + "\n".join(canvas_lines) + f"\n\n{footer}")

    def _render_fallback(self, network: NetworkData) -> None:
        """Simple edge list when networkx is unavailable."""
        id_to_label = {n.data["id"]: n.data.get("label", n.data["id"]) for n in network.nodes}
        lines = [
            f"[bold cyan]Network[/bold cyan] — {len(network.nodes)} proteins · {len(network.edges)} interactions\n"
        ]
        for edge in network.edges[:30]:
            d = edge.data
            src = id_to_label.get(d.get("source", ""), d.get("source", ""))
            tgt = id_to_label.get(d.get("target", ""), d.get("target", ""))
            lines.append(f"  [cyan]{src}[/cyan] ── [cyan]{tgt}[/cyan]")
        if len(network.edges) > 30:
            lines.append(f"\n  [dim]... and {len(network.edges) - 30} more[/dim]")
        lines.append("\n[dim]e export  ·  esc back[/dim]")
        self.update("\n".join(lines))
