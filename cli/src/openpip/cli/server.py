import subprocess
from pathlib import Path
import click
from rich.console import Console

console = Console()


def _find_compose_file() -> Path | None:
    """Walk up from cwd to find docker-compose.yml."""
    here = Path.cwd()
    for parent in [here] + list(here.parents):
        candidate = parent / "docker-compose.yml"
        if candidate.exists():
            return candidate
    return None


def _run_compose(args: list[str]) -> None:
    compose_file = _find_compose_file()
    if not compose_file:
        console.print("[red]Error:[/red] Could not find docker-compose.yml. Run from inside the openpip-2.0 directory.")
        raise SystemExit(1)
    cmd = ["docker", "compose", "-f", str(compose_file)] + args
    subprocess.run(cmd, check=False)


@click.group("server")
def server_group():
    """Manage the openPIP server stack (docker compose)."""


@server_group.command("start")
def server_start():
    """Start all services (docker compose up -d)."""
    _run_compose(["up", "-d"])


@server_group.command("stop")
def server_stop():
    """Stop all services without removing containers (docker compose stop)."""
    _run_compose(["stop"])


@server_group.command("status")
def server_status():
    """Show running containers (docker compose ps)."""
    _run_compose(["ps"])


@server_group.command("logs")
@click.argument("service", default="backend")
@click.option("--follow", "-f", is_flag=True, help="Follow log output")
def server_logs(service: str, follow: bool):
    """Tail service logs. Defaults to 'backend'."""
    args = ["logs", service]
    if follow:
        args.append("-f")
    _run_compose(args)


@server_group.command("build")
def server_build():
    """Rebuild images (docker compose build)."""
    _run_compose(["build"])


@click.group("db")
def db_group():
    """Database management commands."""


@db_group.command("migrate")
def db_migrate():
    """Apply pending Django migrations."""
    compose_file = _find_compose_file()
    if not compose_file:
        console.print("[red]Error:[/red] Could not find docker-compose.yml.")
        raise SystemExit(1)
    subprocess.run(
        ["docker", "compose", "-f", str(compose_file),
         "exec", "backend", "python", "manage.py", "migrate"],
        check=False,
    )
