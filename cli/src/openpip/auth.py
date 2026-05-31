import httpx
from .exceptions import AuthRequired


def fetch_token(url: str, username: str, password: str) -> str:
    response = httpx.post(
        f"{url.rstrip('/')}/api/auth/login",
        json={"username": username, "password": password},
        timeout=10,
    )
    if response.status_code == 401:
        raise AuthRequired("Invalid username or password.")
    response.raise_for_status()
    return response.json()["access"]
