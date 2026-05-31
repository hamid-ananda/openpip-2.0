# cli/tests/test_tui.py
import pytest
from openpip.tui.app import OpenPIPApp
from openpip.tui.screens.home import HomeScreen
from openpip.tui.screens.search import SearchScreen


def _screen_name(app) -> str:
    """Return the installed name for the current screen, or the class name."""
    screen = app.screen
    for name, s in app._installed_screens.items():
        if s is screen:
            return name
    return type(screen).__name__


@pytest.mark.asyncio
async def test_app_mounts_without_error():
    """App should mount and show Home screen without crashing."""
    async with OpenPIPApp().run_test(headless=True) as pilot:
        await pilot.pause()
        assert _screen_name(pilot.app) == "home"


@pytest.mark.asyncio
async def test_quit_binding():
    """Pressing q should exit the app cleanly."""
    async with OpenPIPApp().run_test(headless=True) as pilot:
        await pilot.press("q")


@pytest.mark.asyncio
async def test_search_binding():
    """Pressing s should navigate to search screen."""
    async with OpenPIPApp().run_test(headless=True) as pilot:
        await pilot.press("s")
        await pilot.pause()
        assert _screen_name(pilot.app) == "search"
