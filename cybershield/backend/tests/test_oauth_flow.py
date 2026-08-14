"""
End-to-end verification of the Google/GitHub OAuth flow with stubbed providers.

The external token-exchange and userinfo HTTP calls made by oauth_service are
mocked, so the whole flow runs offline. Requests go through a real ASGI server
(httpx.ASGITransport) so URL routing, query params, and redirects are exercised
for real. It proves that once real credentials are present in .env the
endpoints behave correctly (authorization URL, signed-state callback,
find-or-create user, token issuance, error redirects).
"""
from unittest.mock import AsyncMock
from urllib.parse import parse_qs, urlparse

import anyio
import httpx
import pytest
from bson import ObjectId

from app.main import app
from app.config.settings import settings as cfg_settings
from app.services import oauth_service as oauth
from app.repositories.user_repository import user_repository
from app.services.refresh_service import refresh_service
from app.services.session_service import session_service
from app.utils.security import verify_token


def _get(path, params=None):
    """Run a GET through httpx's ASGITransport (no starlette TestClient,
    which is incompatible with httpx 0.28 in this environment)."""
    transport = httpx.ASGITransport(app=app)

    async def call():
        async with httpx.AsyncClient(
            transport=transport, base_url="http://test", follow_redirects=False
        ) as ac:
            return await ac.get(path, params=params)

    return anyio.run(call)


class FakeResponse:
    def __init__(self, data):
        self._data = data

    def json(self):
        return self._data

    def raise_for_status(self):
        return None


class FakeAsyncClient:
    """httpx.AsyncClient stand-in returning canned responses per URL."""

    def __init__(self, gets):
        self.gets = gets

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def post(self, url=None, *args, **kwargs):
        return FakeResponse({"access_token": "stubbed-access-token"})

    async def get(self, url=None, *args, **kwargs):
        return FakeResponse(self.gets.get(url, {}))


GOOGLE_NORMALIZED = {
    "oauth_id": "123456789",
    "email": "test-oauth@example.com",
    "name": "Test OAuth User",
    "avatar_url": "https://example.com/avatar.png",
}

GITHUB_NORMALIZED = {
    "oauth_id": "987654321",
    "email": "test-oauth@example.com",
    "name": "Test OAuth User",
    "avatar_url": "https://example.com/avatar.png",
}

GITHUB_RAW_PROFILE = {
    "id": 987654321,
    "login": "octocat",
    "name": "Test OAuth User",
    "email": "test-oauth@example.com",
    "avatar_url": "https://example.com/avatar.png",
}


def _make_user(_id="5f5e5c5e5c5e5c5e5c5e5c01", **overrides):
    user = {
        "_id": ObjectId(_id),
        "name": "Test OAuth User",
        "email": "test-oauth@example.com",
        "password_hash": "",
        "role": "student",
        "is_verified": True,
        "account_status": "active",
        "first_login": True,
        "profile_completed": False,
        "auth_provider": "google",
        "avatar": "",
    }
    user.update(overrides)
    return user


def _query_param(url, key):
    return parse_qs(urlparse(url).query)[key][0]


def _configure_creds(monkeypatch):
    monkeypatch.setattr(cfg_settings, "GOOGLE_CLIENT_ID", "google-test-id")
    monkeypatch.setattr(cfg_settings, "GOOGLE_CLIENT_SECRET", "google-test-secret")
    monkeypatch.setattr(cfg_settings, "GITHUB_CLIENT_ID", "github-test-id")
    monkeypatch.setattr(cfg_settings, "GITHUB_CLIENT_SECRET", "github-test-secret")


def _stub_provider(monkeypatch, google_profile=None, github_profile=None):
    """Stub the external calls on oauth_service without touching the global
    httpx.AsyncClient (which the ASGI test transport also needs)."""
    if google_profile is not None:
        monkeypatch.setattr(oauth, "_exchange_code", AsyncMock(return_value="stubbed-at"))
        monkeypatch.setattr(oauth, "_fetch_google_profile", AsyncMock(return_value=google_profile))
    if github_profile is not None:
        monkeypatch.setattr(oauth, "_exchange_code", AsyncMock(return_value="stubbed-at"))
        monkeypatch.setattr(oauth, "_fetch_github_profile", AsyncMock(return_value=github_profile))


def _stub_services(monkeypatch):
    monkeypatch.setattr(refresh_service, "store_refresh_token", AsyncMock(return_value=True))
    monkeypatch.setattr(session_service, "create_session", AsyncMock(return_value="session-id"))


def test_oauth_auth_url_endpoints(monkeypatch):
    """GET /oauth/{provider} returns the provider's authorization URL once configured."""
    _configure_creds(monkeypatch)

    google = _get("/api/v1/auth/oauth/google")
    assert google.status_code == 200
    url = google.json()["authorization_url"]
    assert url.startswith("https://accounts.google.com/o/oauth2/v2/auth")
    assert "client_id=google-test-id" in url
    assert "state=" in url

    github = _get("/api/v1/auth/oauth/github")
    assert github.status_code == 200
    url = github.json()["authorization_url"]
    assert url.startswith("https://github.com/login/oauth/authorize")
    assert "client_id=github-test-id" in url
    assert "scope=read%3Auser+user%3Aemail" in url
    assert "state=" in url


def test_oauth_unsupported_provider_returns_400():
    response = _get("/api/v1/auth/oauth/twitter")
    assert response.status_code == 400


def test_oauth_unconfigured_provider_returns_503():
    # No credentials configured -> friendly 503 (the message the user saw).
    response = _get("/api/v1/auth/oauth/google")
    assert response.status_code == 503
    assert "not configured" in response.json()["detail"]


def test_google_callback_creates_new_user(monkeypatch):
    _configure_creds(monkeypatch)
    _stub_provider(monkeypatch, google_profile=GOOGLE_NORMALIZED)
    _stub_services(monkeypatch)

    # User does not exist -> create flow.
    monkeypatch.setattr(user_repository, "get_user_by_email", AsyncMock(return_value=None))
    monkeypatch.setattr(
        user_repository, "create_user", AsyncMock(return_value="5f5e5c5e5c5e5c5e5c5e5c02")
    )
    monkeypatch.setattr(
        user_repository,
        "get_user_by_id",
        AsyncMock(return_value=_make_user(_id="5f5e5c5e5c5e5c5e5c5e5c02")),
    )
    monkeypatch.setattr(user_repository, "update_user", AsyncMock(return_value=True))

    state = oauth._create_state("google")
    resp = _get(
        "/api/v1/auth/oauth/google/callback",
        params={"code": "auth-code", "state": state},
    )

    assert resp.status_code in (302, 307)
    location = resp.headers["location"]
    assert location.startswith("http://localhost:5173/oauth/callback")
    assert "access_token=" in location
    assert "refresh_token=" in location
    assert "first_login=true" in location

    access_token = _query_param(location, "access_token")
    payload = verify_token(access_token, "access")
    assert payload["user_id"] == "5f5e5c5e5c5e5c5e5c5e5c02"
    assert payload["role"] == "student"


def test_google_callback_existing_user_skips_onboarding(monkeypatch):
    _configure_creds(monkeypatch)
    _stub_provider(monkeypatch, google_profile=GOOGLE_NORMALIZED)
    _stub_services(monkeypatch)

    existing = _make_user(first_login=False, account_status="active")
    monkeypatch.setattr(user_repository, "get_user_by_email", AsyncMock(return_value=existing))
    monkeypatch.setattr(user_repository, "update_user", AsyncMock(return_value=True))

    state = oauth._create_state("google")
    resp = _get(
        "/api/v1/auth/oauth/google/callback",
        params={"code": "auth-code", "state": state},
    )

    assert resp.status_code in (302, 307)
    assert "first_login=false" in resp.headers["location"]


def test_github_callback_creates_user(monkeypatch):
    _configure_creds(monkeypatch)
    _stub_provider(monkeypatch, github_profile=GITHUB_NORMALIZED)
    _stub_services(monkeypatch)

    monkeypatch.setattr(user_repository, "get_user_by_email", AsyncMock(return_value=None))
    monkeypatch.setattr(
        user_repository, "create_user", AsyncMock(return_value="5f5e5c5e5c5e5c5e5c5e5c02")
    )
    monkeypatch.setattr(
        user_repository,
        "get_user_by_id",
        AsyncMock(return_value=_make_user(_id="5f5e5c5e5c5e5c5e5c5e5c02")),
    )
    monkeypatch.setattr(user_repository, "update_user", AsyncMock(return_value=True))

    state = oauth._create_state("github")
    resp = _get(
        "/api/v1/auth/oauth/github/callback",
        params={"code": "auth-code", "state": state},
    )

    assert resp.status_code in (302, 307)
    assert "first_login=true" in resp.headers["location"]


def test_github_profile_falls_back_to_emails_endpoint(monkeypatch):
    """Unit-level check that _fetch_github_profile uses /user/emails when the
    /user endpoint returns no email."""
    fake = FakeAsyncClient(
        {
            oauth.GITHUB_USER_URL: {**GITHUB_RAW_PROFILE, "email": None},
            oauth.GITHUB_EMAILS_URL: [
                {"email": "test-oauth@example.com", "verified": True, "primary": True},
                {"email": "secondary@example.com", "verified": False, "primary": False},
            ],
        }
    )
    monkeypatch.setattr(oauth.httpx, "AsyncClient", lambda *a, **k: fake)

    profile = anyio.run(oauth._fetch_github_profile, "any-token")
    assert profile["email"] == "test-oauth@example.com"
    assert profile["oauth_id"] == "987654321"


def test_callback_invalid_state_redirects_with_error(monkeypatch):
    _configure_creds(monkeypatch)
    _stub_provider(monkeypatch, google_profile=GOOGLE_NORMALIZED)

    resp = _get(
        "/api/v1/auth/oauth/google/callback",
        params={"code": "auth-code", "state": "definitely-not-a-jwt"},
    )
    assert resp.status_code in (302, 307)
    assert "error=" in resp.headers["location"]


def test_callback_missing_state_redirects_with_error():
    resp = _get("/api/v1/auth/oauth/google/callback", params={"code": "auth-code"})
    assert resp.status_code in (302, 307)
    assert "error=Missing+OAuth+state" in resp.headers["location"]