from pathlib import Path
from openpip.config import Config, load_config, save_config, DEFAULT_URL


def test_default_config():
    cfg = Config()
    assert cfg.url == DEFAULT_URL
    assert cfg.interface == "tui"
    assert cfg.username is None
    assert cfg.token is None


def test_save_and_load_config(tmp_path):
    config_file = tmp_path / "config.yaml"
    cfg = Config(url="http://localhost:8001", interface="rich")
    save_config(cfg, path=config_file)
    loaded = load_config(path=config_file)
    assert loaded.url == "http://localhost:8001"
    assert loaded.interface == "rich"


def test_load_missing_config_returns_none(tmp_path):
    result = load_config(path=tmp_path / "nonexistent.yaml")
    assert result is None


def test_config_with_credentials(tmp_path):
    config_file = tmp_path / "config.yaml"
    cfg = Config(username="admin", token="eyJxxx")
    save_config(cfg, path=config_file)
    loaded = load_config(path=config_file)
    assert loaded.username == "admin"
    assert loaded.token == "eyJxxx"
