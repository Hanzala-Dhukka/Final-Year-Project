"""
Dashboard WebSocket route.

Clients connect to  ws://<host>/ws/dashboard
and receive real-time security events pushed by backend services.

Message types sent to clients
──────────────────────────────
connected          — handshake confirmation
scan_progress      — { progress: 0-100, file: str, project: str }
scan_completed     — { project: str, critical: int, high: int, … }
security_event     — { type, title, severity, project, description }
threat_detected    — { threat, severity, project }
quiz_completed     — { user_id, score, topic }
owasp_completed    — { user_id, lab_name }
pong               — keepalive reply
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import jwt, JWTError

from app.config.settings import settings
from app.websocket.manager import manager

router = APIRouter(tags=["WebSocket"])


def _extract_user_id(token: str) -> Optional[str]:
    """Attempt to pull user_id from a JWT token string, returns None on failure."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return str(payload.get("user_id") or payload.get("sub") or "")
    except JWTError:
        return None


@router.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket) -> None:
    """
    Main real-time dashboard endpoint.

    Clients may optionally pass a JWT token as a query-parameter so they
    receive targeted (per-user) messages as well as global broadcasts:

        ws://localhost:8000/ws/dashboard?token=<jwt>
    """
    token: str = websocket.query_params.get("token", "")
    user_id: Optional[str] = _extract_user_id(token) if token else None

    await manager.connect(websocket, user_id=user_id)

    try:
        # Handshake confirmation
        await websocket.send_json({
            "event": "connected",
            "message": "Real-time dashboard stream connected",
            "user_id": user_id or "anonymous",
            "connections": manager.connection_count,
            "timestamp": datetime.now(timezone.utc).strftime("%I:%M %p"),
        })

        # Keep connection alive; clients may send keepalive pings
        while True:
            raw = await websocket.receive_text()
            # Echo keepalive pings
            await websocket.send_json({
                "event": "pong",
                "timestamp": datetime.now(timezone.utc).strftime("%I:%M %p"),
            })

    except WebSocketDisconnect:
        await manager.disconnect(websocket, user_id=user_id)
    except Exception:
        await manager.disconnect(websocket, user_id=user_id)
