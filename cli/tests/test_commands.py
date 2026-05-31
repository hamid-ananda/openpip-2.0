import pytest
import httpx
import respx
from click.testing import CliRunner
from openpip.cli import main
from openpip.config import Config

BASE = "https://openpip.usask.ca"

SEARCH_RESPONSE = {
    "results": [{"id": 1, "gene_name": "BRCA1", "uniprot_id": "P38398"}],
    "count": 1, "next": None, "previous": None,
}


@pytest.fixture(autouse=True)
def mock_config(monkeypatch):
    """Patch get_or_create_config everywhere it is imported so tests
    don't touch ~/.openpip or trigger the first-run wizard."""
    cfg = Config(url=BASE, interface="rich")

    import openpip.config as cfg_module
    import openpip.cli.commands as cmd_module
    import openpip.cli.config_cmd as ccmd_module

    monkeypatch.setattr(cfg_module, "get_or_create_config", lambda: cfg)
    monkeypatch.setattr(cmd_module, "get_or_create_config", lambda: cfg)
    monkeypatch.setattr(ccmd_module, "get_or_create_config", lambda: cfg)
    # Also patch save_config so config set doesn't write to disk
    monkeypatch.setattr(cfg_module, "save_config", lambda c, path=None: None)
    monkeypatch.setattr(ccmd_module, "save_config", lambda c, path=None: None)
    return cfg


def test_search_command_prints_table():
    runner = CliRunner()
    with respx.mock(base_url=BASE, assert_all_called=False) as mock:
        mock.get("/api/search/").mock(return_value=httpx.Response(200, json=SEARCH_RESPONSE))
        result = runner.invoke(main, ["search", "BRCA1"])
    assert result.exit_code == 0, result.output
    assert "BRCA1" in result.output


def test_search_command_no_results():
    runner = CliRunner()
    with respx.mock(base_url=BASE, assert_all_called=False) as mock:
        mock.get("/api/search/").mock(return_value=httpx.Response(200, json={
            "results": [], "count": 0, "next": None, "previous": None
        }))
        result = runner.invoke(main, ["search", "ZZZNOMATCH"])
    assert result.exit_code == 0, result.output
    assert "No results" in result.output


def test_datasets_command():
    runner = CliRunner()
    with respx.mock(base_url=BASE, assert_all_called=False) as mock:
        mock.get("/api/datasets/").mock(return_value=httpx.Response(200, json={
            "results": [{"id": 1, "name": "YeRI", "author": "Foo", "year": "2020", "number_of_interactions": "500"}],
            "count": 1, "next": None, "previous": None,
        }))
        result = runner.invoke(main, ["datasets"])
    assert result.exit_code == 0, result.output
    assert "YeRI" in result.output


def test_config_show_command():
    runner = CliRunner()
    result = runner.invoke(main, ["config", "show"])
    assert result.exit_code == 0, result.output
    assert BASE in result.output


def test_config_set_interface():
    runner = CliRunner()
    result = runner.invoke(main, ["config", "set", "interface", "tui"])
    assert result.exit_code == 0, result.output
