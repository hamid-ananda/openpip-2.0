from pathlib import Path
from openpip.models import NetworkData
from openpip.export import export_network


SAMPLE_NETWORK = {
    "nodes": [
        {"data": {"id": "1", "label": "BRCA1", "uniprot_id": "P38398"}},
        {"data": {"id": "2", "label": "TP53", "uniprot_id": "P04637"}},
    ],
    "edges": [
        {"data": {"source": "1", "target": "2", "weight": 0.98, "id": "e1"}}
    ],
}


def test_export_graphml(tmp_path):
    import json
    network = NetworkData.model_validate(SAMPLE_NETWORK)
    out = tmp_path / "network.graphml"
    result = export_network(network, str(out))
    assert result == out
    assert out.exists()
    content = out.read_text()
    assert "graphml" in content
    assert "BRCA1" in content


def test_export_json(tmp_path):
    import json
    network = NetworkData.model_validate(SAMPLE_NETWORK)
    out = tmp_path / "network.json"
    export_network(network, str(out))
    data = json.loads(out.read_text())
    assert "nodes" in data
    assert "edges" in data


def test_export_tsv(tmp_path):
    network = NetworkData.model_validate(SAMPLE_NETWORK)
    out = tmp_path / "edges.tsv"
    export_network(network, str(out))
    lines = out.read_text().strip().split("\n")
    assert lines[0].startswith("source\t")
    assert len(lines) == 2  # header + 1 edge


def test_export_png_matplotlib(tmp_path):
    network = NetworkData.model_validate(SAMPLE_NETWORK)
    out = tmp_path / "graph.png"
    export_network(network, str(out), renderer="matplotlib")
    assert out.exists()
    assert out.stat().st_size > 0


def test_unsupported_format_raises(tmp_path):
    network = NetworkData.model_validate(SAMPLE_NETWORK)
    import pytest
    with pytest.raises(ValueError, match="Unsupported"):
        export_network(network, str(tmp_path / "output.xyz"))
