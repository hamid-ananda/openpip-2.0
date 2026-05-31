from __future__ import annotations
import json
from pathlib import Path
from typing import Optional
from .models import NetworkData

TEMPLATE_PATH = Path(__file__).parent / "templates" / "network.html"


def export_network(
    network: NetworkData,
    path: str,
    renderer: str = "auto",
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
            return _export_matplotlib(network, out, ext)
        return _export_cytoscape(network, out, ext, width, height)

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
        G.add_node(d["id"], label=d.get("label", d["id"]))
    for edge in network.edges:
        d = edge.data
        G.add_edge(d["source"], d["target"], weight=float(d.get("weight", 1)))
    return G


def _export_matplotlib(network: NetworkData, out: Path, ext: str) -> Path:
    import networkx as nx
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    G = _to_networkx(network)
    pos = nx.spring_layout(G, seed=42)
    labels = {n: G.nodes[n].get("label", n) for n in G.nodes}

    fig, ax = plt.subplots(figsize=(12, 9), facecolor="#1a1a2e")
    ax.set_facecolor("#1a1a2e")
    nx.draw_networkx(G, pos, ax=ax, labels=labels, node_color="#4cc9f0",
                     node_size=800, font_color="white", font_size=9,
                     edge_color="#555555", width=1.5)
    ax.axis("off")
    plt.tight_layout()
    plt.savefig(str(out), format=ext.lstrip("."), dpi=150, facecolor="#1a1a2e")
    plt.close(fig)
    return out


def _export_cytoscape(network: NetworkData, out: Path, ext: str, width: int, height: int) -> Path:
    try:
        return _render_with_playwright(network, out, ext, width, height)
    except Exception:
        return _export_matplotlib(network, out, ext)


def _render_with_playwright(network: NetworkData, out: Path, ext: str, width: int, height: int) -> Path:
    from playwright.sync_api import sync_playwright
    import base64

    elements = {"nodes": [n.data for n in network.nodes], "edges": [e.data for e in network.edges]}
    html = TEMPLATE_PATH.read_text()
    html = html.replace("{{ELEMENTS}}", json.dumps(elements))
    html = html.replace("{{WIDTH}}", str(width))
    html = html.replace("{{HEIGHT}}", str(height))

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
