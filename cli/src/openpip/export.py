from __future__ import annotations
import json
from pathlib import Path
from typing import Optional
from .models import NetworkData

TEMPLATE_PATH = Path(__file__).parent / "templates" / "network.html"


LAYOUTS = ("cose", "cola", "concentric", "circle", "grid")


def export_network(
    network: NetworkData,
    path: str,
    renderer: str = "auto",
    layout: str = "cose",
    width: int = 1200,
    height: int = 900,
) -> Path:
    """
    Export a network to a file. Format detected from extension.

    Image formats (png, svg, pdf): Playwright (Cytoscape.js) → matplotlib fallback.
    Data formats (json, graphml, tsv, tab): no renderer needed.
    """
    out = Path(path)
    ext = out.suffix.lower()

    if ext == ".json":
        return _export_json(network, out)
    if ext == ".graphml":
        return _export_graphml(network, out)
    if ext in (".tsv", ".tab"):
        return _export_tsv(network, out)
    if ext in (".png", ".svg", ".pdf"):
        if renderer == "matplotlib":
            return _export_matplotlib(network, out, ext, layout=layout)
        return _export_cytoscape(network, out, ext, width, height, layout=layout)

    raise ValueError(f"Unsupported export format: {ext}. Use png, svg, pdf, json, graphml, or tsv.")


def _export_json(network: NetworkData, out: Path) -> Path:
    data = {"nodes": [n.data for n in network.nodes], "edges": [e.data for e in network.edges]}
    out.write_text(json.dumps(data, indent=2))
    return out


def _export_graphml(network: NetworkData, out: Path) -> Path:
    import networkx as nx
    G = _to_networkx(network)
    nx.write_graphml(G, str(out))
    return out


def _export_tsv(network: NetworkData, out: Path) -> Path:
    lines = ["source\ttarget\tweight\tid"]
    for edge in network.edges:
        d = edge.data
        lines.append(f"{d.get('source','')}\t{d.get('target','')}\t{d.get('weight','')}\t{d.get('id','')}")
    out.write_text("\n".join(lines))
    return out


def _to_networkx(network: NetworkData):
    import networkx as nx
    G = nx.Graph()
    for node in network.nodes:
        d = node.data
        G.add_node(d["id"], label=d.get("label", d["id"]), is_query=d.get("is_query", False))
    for edge in network.edges:
        d = edge.data
        G.add_edge(d["source"], d["target"], weight=float(d.get("weight") or 1))
    return G


def _nx_layout(G, layout: str, seed: int = 42):
    import networkx as nx
    if layout == "circle":
        return nx.circular_layout(G)
    if layout == "concentric":
        # query nodes in inner shell, interactors in outer shell
        query = [n for n in G.nodes if G.nodes[n].get("is_query")]
        interactors = [n for n in G.nodes if not G.nodes[n].get("is_query")]
        shells = [query, interactors] if query else [list(G.nodes)]
        return nx.shell_layout(G, nlist=shells)
    if layout == "grid":
        import math
        nodes = list(G.nodes)
        cols = math.ceil(math.sqrt(len(nodes)))
        return {n: (i % cols, -(i // cols)) for i, n in enumerate(nodes)}
    # cose and cola both map to spring (force-directed)
    return nx.spring_layout(G, seed=seed, k=2.5)


def _export_matplotlib(network: NetworkData, out: Path, ext: str, layout: str = "cose",
                        figsize: tuple[float, float] | None = None) -> Path:
    import networkx as nx
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.lines import Line2D

    G = _to_networkx(network)
    pos = _nx_layout(G, layout)
    labels = {n: G.nodes[n].get("label", n) for n in G.nodes}

    query_nodes = [n for n in G.nodes if G.nodes[n].get("is_query")]
    interactor_nodes = [n for n in G.nodes if not G.nodes[n].get("is_query")]

    fig, ax = plt.subplots(figsize=figsize or (14, 10), facecolor="#1a1a2e")
    ax.set_facecolor("#1a1a2e")

    nx.draw_networkx_edges(G, pos, ax=ax, edge_color="#44475a", width=1.0, alpha=0.6)

    nx.draw_networkx_nodes(G, pos, ax=ax, nodelist=interactor_nodes,
                           node_color="#4cc9f0", node_size=600, alpha=0.9)
    nx.draw_networkx_nodes(G, pos, ax=ax, nodelist=query_nodes,
                           node_color="#ff6b6b", node_size=1200, alpha=1.0)

    nx.draw_networkx_labels(G, pos, ax=ax, labels=labels,
                            font_color="white", font_size=8, font_weight="bold")

    legend = [
        Line2D([0], [0], marker="o", color="w", markerfacecolor="#ff6b6b",
               markersize=12, label="Query protein"),
        Line2D([0], [0], marker="o", color="w", markerfacecolor="#4cc9f0",
               markersize=10, label="Interactor"),
    ]
    ax.legend(handles=legend, loc="upper left", framealpha=0.3,
              facecolor="#1a1a2e", labelcolor="white", fontsize=10)

    ax.axis("off")
    plt.tight_layout()
    plt.savefig(str(out), format=ext.lstrip("."), dpi=150, facecolor="#1a1a2e")
    plt.close(fig)
    return out


def _export_cytoscape(network: NetworkData, out: Path, ext: str, width: int, height: int, layout: str = "cose") -> Path:
    try:
        return _render_with_playwright(network, out, ext, width, height, layout)
    except Exception:
        return _export_matplotlib(network, out, ext, layout=layout)


def _render_with_playwright(network: NetworkData, out: Path, ext: str, width: int, height: int, layout: str = "cose") -> Path:
    from playwright.sync_api import sync_playwright
    import base64

    elements = {"nodes": [n.data for n in network.nodes], "edges": [e.data for e in network.edges]}
    html = TEMPLATE_PATH.read_text()
    html = html.replace("{{ELEMENTS}}", json.dumps(elements))
    html = html.replace("{{WIDTH}}", str(width))
    html = html.replace("{{HEIGHT}}", str(height))
    html = html.replace("{{LAYOUT}}", layout)

    html_file = out.parent / f"_openpip_tmp_{out.stem}.html"
    html_file.write_text(html)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": width, "height": height})
            page.goto(f"file://{html_file.absolute()}")
            page.wait_for_function("document.title === 'READY'", timeout=10000)

            if ext == ".png":
                img_b64 = page.evaluate("window.onCytoscapeReady()")
                img_data = img_b64.split(",")[1] if "," in img_b64 else img_b64
                out.write_bytes(base64.b64decode(img_data))
            elif ext == ".svg":
                svg = page.evaluate("cy.svg({full:true})")
                out.write_text(svg)
            elif ext == ".pdf":
                out.write_bytes(page.pdf())

            browser.close()
    finally:
        if html_file.exists():
            html_file.unlink()

    return out
