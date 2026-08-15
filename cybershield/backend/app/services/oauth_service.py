"""
OAuth service for social registration/login (Google + GitHub).

Flows:
- GET  /api/v1/auth/oauth/{provider}  -> JSON {"authorization_url": ...}
- GET  /api/v1/auth/oauth/{provider}/callback?code=...&state=...
       -> 302 redirect back to the frontend with tokens or an error.
"""
import secrets
from datetime import datetime, timezone, timedelta
from typing import Dict, Optional
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, Request
from jose import jwt as _jwt

from app.config.settings import settings as cfg_settings
from app.repositories.user_repository import user_repository
from app.services.refresh_service import refresh_service
from app.services.session_service import session_service
from app.utils.security import create_access_token, create_refresh_token

VALID_PROVIDERS = ("google", "github")

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"

STATE_TTL_MINUTES = 10


def _get_backend_base_url(request: Optional[Request] = None) -> str:
    """Derive the backend base URL from proxy-forwarded headers or request."""
    if not request:
        return ""
    # Prefer X-Forwarded-Host / X-Forwarded-Proto (set by Render, nginx, etc.)
    forwarded_host = request.headers.get("x-forwarded-host") or ""
    forwarded_proto = request.headers.get("x-forwarded-proto") or ""
    if forwarded_host:
        host = forwarded_host.split(",")[0].strip()
        scheme = forwarded_proto.split(",")[0].strip() if forwarded_proto else "https"
        return f"{scheme}://{host}"
    # Fallback: Host header (works in dev when no proxy is involved)
    host_header = request.headers.get("host") or ""
    if host_header:
        scheme = forwarded_proto.split(",")[0].strip() if forwarded_proto else "https"
        return f"{scheme}://{host_header}"
    # Last resort: request.base_url
    if hasattr(request, "base_url"):
        return str(request.base_url).rstrip("/")
    return ""


def _get_frontend_url(request: Optional[Request] = None) -> str:
    """Derive the frontend URL from the request's Origin or Referer header."""
    if request:
        origin = request.headers.get("origin") or ""
        if origin:
            return origin.rstrip("/")
        referer = request.headers.get("referer") or ""
        if referer:
            from urllib.parse import urlparse
            parsed = urlparse(referer)
            if parsed.scheme and parsed.netloc:
                return f"{parsed.scheme}://{parsed.netloc}"
    return cfg_settings.FRONTEND_URL


def _client_config(provider: str, request: Optional[Request] = None) -> Dict[str, str]:
    if provider == "google":
        client_id = cfg_settings.GOOGLE_CLIENT_ID
        client_secret = cfg_settings.GOOGLE_CLIENT_SECRET
        redirect_uri = cfg_settings.GOOGLE_REDIRECT_URI
    elif provider == "github":
        client_id = cfg_settings.GITHUB_CLIENT_ID
        client_secret = cfg_settings.GITHUB_CLIENT_SECRET
        redirect_uri = cfg_settings.GITHUB_REDIRECT_URI
    else:
        raise HTTPException(status_code=400, detail="Unsupported OAuth provider")

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=503,
            detail=f"{provider.title()} OAuth is not configured yet. Please try another method.",
        )

    # Build the redirect URI with this priority:
    # 1. From request headers (X-Forwarded-Host/Proto) — works behind proxies
    # 2. From BACKEND_URL env var — reliable fallback for production
    # 3. From provider-specific env var (GOOGLE_REDIRECT_URI / GITHUB_REDIRECT_URI)
    if request:
        base_url = _get_backend_base_url(request)
        if base_url:
            redirect_uri = f"{base_url}/api/v1/auth/oauth/{provider}/callback"
            return {
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
            }

    # Fallback: use BACKEND_URL to construct the redirect URI
    backend_url = cfg_settings.BACKEND_URL.rstrip("/")
    if backend_url:
        redirect_uri = f"{backend_url}/api/v1/auth/oauth/{provider}/callback"

    return {
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
    }


def _create_state(provider: str, request: Optional[Request] = None) -> str:
    frontend_url = _get_frontend_url(request)
    payload = {
        "type": "oauth_state",
        "provider": provider,
        "frontend_url": frontend_url,
        "nonce": secrets.token_urlsafe(16),
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=STATE_TTL_MINUTES),
    }
    return _jwt.encode(payload, cfg_settings.SECRET_KEY, algorithm=cfg_settings.ALGORITHM)


def _verify_state(state: Optional[str], provider: str) -> Dict:
    if not state:
        raise HTTPException(status_code=400, detail="Missing OAuth state")
    try:
        payload = _jwt.decode(
            state,
            cfg_settings.SECRET_KEY,
            algorithms=[cfg_settings.ALGORITHM],
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")
    if payload.get("type") != "oauth_state" or payload.get("provider") != provider:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")
    return payload


def build_authorization_url(provider: str, request: Optional[Request] = None) -> str:
    if provider not in VALID_PROVIDERS:
        raise HTTPException(status_code=400, detail="Unsupported OAuth provider")

    config = _client_config(provider, request)

    print(f"[OAuth] provider={provider} redirect_uri={config['redirect_uri']}")
    print(f"[OAuth] headers: x-forwarded-host={request.headers.get('x-forwarded-host') if request else 'N/A'}")
    print(f"[OAuth] headers: x-forwarded-proto={request.headers.get('x-forwarded-proto') if request else 'N/A'}")
    print(f"[OAuth] headers: host={request.headers.get('host') if request else 'N/A'}")

    if provider == "google":
        params = {
            "client_id": config["client_id"],
            "redirect_uri": config["redirect_uri"],
            "response_type": "code",
            "scope": "openid email profile",
            "state": _create_state(provider, request),
            "prompt": "select_account",
        }
        return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"

    params = {
        "client_id": config["client_id"],
        "redirect_uri": config["redirect_uri"],
        "scope": "read:user user:email",
        "state": _create_state(provider, request),
    }
    return f"{GITHUB_AUTH_URL}?{urlencode(params)}"


async def _exchange_code(provider: str, config: Dict[str, str], code: str) -> str:
    if provider == "google":
        payload = {
            "code": code,
            "client_id": config["client_id"],
            "client_secret": config["client_secret"],
            "redirect_uri": config["redirect_uri"],
            "grant_type": "authorization_code",
        }
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(GOOGLE_TOKEN_URL, data=payload)
    else:
        payload = {
            "code": code,
            "client_id": config["client_id"],
            "client_secret": config["client_secret"],
            "redirect_uri": config["redirect_uri"],
        }
        headers = {"Accept": "application/json"}
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(GITHUB_TOKEN_URL, data=payload, headers=headers)

    data = response.json()
    access_token = data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="OAuth authentication failed")
    return access_token


async def _fetch_google_profile(access_token: str) -> Dict[str, str]:
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(GOOGLE_USERINFO_URL, headers=headers)
    response.raise_for_status()
    info = response.json()

    email = info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Unable to retrieve your Google email")

    name = (info.get("name") or "").strip() or email.split("@")[0]

    return {
        "oauth_id": str(info.get("sub") or ""),
        "email": email,
        "name": name,
        "avatar_url": info.get("picture") or "",
    }


async def _fetch_github_profile(access_token: str) -> Dict[str, str]:
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "CyberShield",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(GITHUB_USER_URL, headers=headers)
    response.raise_for_status()
    info = response.json()

    email = info.get("email") or ""
    if not email:
        async with httpx.AsyncClient(timeout=15) as client:
            emails_response = await client.get(GITHUB_EMAILS_URL, headers=headers)
        emails_response.raise_for_status()
        for entry in emails_response.json():
            if entry.get("primary") and entry.get("verified"):
                email = entry.get("email") or ""
                break

    if not email:
        raise HTTPException(
            status_code=400,
            detail="No verified email found on your GitHub account. Please add one and try again.",
        )

    login = info.get("login") or ""
    name = (info.get("name") or "").strip() or login or email.split("@")[0]

    return {
        "oauth_id": str(info.get("id") or ""),
        "email": email,
        "name": name,
        "avatar_url": info.get("avatar_url") or "",
    }


async def _get_profile(provider: str, config: Dict[str, str], code: str) -> Dict[str, str]:
    access_token = await _exchange_code(provider, config, code)
    if provider == "google":
        return await _fetch_google_profile(access_token)
    return await _fetch_github_profile(access_token)


async def process_oauth_login(
    provider: str, code: str, state: Optional[str], request: Optional[Request] = None
) -> Dict:
    """
    Exchange the OAuth code for a profile, find-or-create the user, and
    return a token payload identical to the normal login flow.
    """
    state_payload = _verify_state(state, provider)
    frontend_url = state_payload.get("frontend_url", cfg_settings.FRONTEND_URL)

    config = _client_config(provider, request)
    print(f"[OAuth callback] provider={provider} redirect_uri={config['redirect_uri']}")
    profile = await _get_profile(provider, config, code)
    email = profile["email"].lower()

    device = "OAuth"
    ip_address = "Unknown"
    if request and request.client:
        ip_address = request.client.host or "Unknown"

    user = await user_repository.get_user_by_email(email)
    is_new_user = False

    if not user:
        user_dict = {
            "name": profile["name"],
            "email": email,
            "password_hash": "",
            "role": "student",
            "is_verified": True,
            "verification_token": None,
            "token_expiry": None,
            "account_status": "active",
            "first_login": True,
            "profile_completed": False,
            "skill_level": "",
            "learning_goals": [],
            "dashboard_tour_completed": False,
            "avatar": profile["avatar_url"],
            "bio": "",
            "auth_provider": provider,
            "oauth_id": profile["oauth_id"],
            "created_at": datetime.now(timezone.utc),
            "last_login": datetime.now(timezone.utc),
        }
        user_id = await user_repository.create_user(user_dict)
        if not user_id:
            raise HTTPException(status_code=500, detail="Failed to create user")
        is_new_user = True
        user = await user_repository.get_user_by_id(user_id)
    else:
        user_id = str(user["_id"])
        updates: Dict = {
            "last_login": datetime.now(timezone.utc),
            "is_verified": True,
        }
        if not user.get("auth_provider"):
            updates["auth_provider"] = provider
        if not user.get("avatar") and profile["avatar_url"]:
            updates["avatar"] = profile["avatar_url"]
        await user_repository.update_user(user_id, updates)

    if user.get("account_status") != "active":
        raise HTTPException(status_code=403, detail="Account is disabled")

    access_token = create_access_token(
        data={"user_id": user_id, "role": user.get("role", "student")}
    )
    refresh_token = create_refresh_token(data={"user_id": user_id})

    try:
        await refresh_service.store_refresh_token(
            user_id=user_id,
            token=refresh_token,
            device=device,
            ip_address=ip_address,
        )
    except Exception as e:
        print(f"WARNING: Failed to store refresh token (oauth): {e}")

    try:
        await session_service.create_session(user_id=user_id, device=device, ip_address=ip_address)
    except Exception as e:
        print(f"WARNING: Failed to create session (oauth): {e}")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "first_login": bool(user.get("first_login", False) or is_new_user),
        "frontend_url": frontend_url,
    }
