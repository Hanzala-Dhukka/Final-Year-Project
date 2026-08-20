from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Body, HTTPException, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Dict, Any, Optional
from datetime import datetime
from jose import jwt

from app.database.db import database
from app.config.settings import settings
from app.repositories.user_repository import user_repository
from app.models.dashboard_preferences import DashboardPreferencesResponse, LayoutItem, DashboardFilters
from app.dashboard.realtime import build_realtime_dashboard

# Use the shared WebSocket manager and event service
from app.websocket.manager import manager
from app.services.event_service import event_service
from app.services.error_log_service import fire_and_forget_log

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

security_optional = HTTPBearer(auto_error=False)

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional)) -> Optional[Dict[str, Any]]:
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("user_id") or payload.get("sub")
        if user_id:
            user = await user_repository.get_user_by_id(str(user_id))
            if user:
                return user
            return {"_id": str(user_id), "username": payload.get("username", "Hanzala")}
    except Exception:
        fire_and_forget_log()
        pass
    return None


@router.get("/overview")
@router.get("/")
@router.get("")
async def get_dashboard(current_user: Optional[dict] = Depends(get_optional_user)):
    user_id = "123"
    username = "Hanzala"
    if current_user and isinstance(current_user, dict):
        user_id = str(current_user.get("_id") or current_user.get("id") or "123")
        username = current_user.get("username") or current_user.get("email", "").split("@")[0] or "Hanzala"

    # Live data only: everything is computed from the user's real activity.
    dash = await build_realtime_dashboard(user_id)
    if not username or username == "Hanzala":
        try:
            if database is not None:
                from bson import ObjectId
                oid = ObjectId(user_id)
                doc = await database.users.find_one({"_id": oid})
                if doc:
                    username = (
                        doc.get("name")
                        or doc.get("full_name")
                        or doc.get("username")
                        or doc.get("email", "").split("@")[0]
                        or "Hanzala"
                    )
        except Exception:
            fire_and_forget_log()
            pass
    dash["username"] = username
    return dash


@router.websocket("/ws")
async def websocket_dashboard(websocket: WebSocket):
    """Legacy /dashboard/ws endpoint — delegates to the shared manager."""
    token: str = websocket.query_params.get("token", "")
    await manager.connect(websocket)
    try:
        await websocket.send_json({
            "event": "connected",
            "message": "Real-time dashboard stream connected",
            "timestamp": datetime.utcnow().strftime("%I:%M %p"),
        })
        while True:
            await websocket.receive_text()
            await websocket.send_json({
                "event": "pong",
                "timestamp": datetime.utcnow().strftime("%I:%M %p"),
            })
    except (WebSocketDisconnect, Exception):
        fire_and_forget_log()
        await manager.disconnect(websocket)


def get_default_layout() -> List[Dict[str, Any]]:
    """Get default dashboard layout"""
    return [
        {"i": "security", "x": 0, "y": 0, "w": 4, "h": 2},
        {"i": "vulnerability", "x": 4, "y": 0, "w": 8, "h": 4},
        {"i": "threat", "x": 0, "y": 2, "w": 6, "h": 3},
        {"i": "weekly", "x": 6, "y": 2, "w": 6, "h": 3},
        {"i": "ai", "x": 0, "y": 5, "w": 6, "h": 3},
        {"i": "achievement", "x": 6, "y": 5, "w": 6, "h": 3},
        {"i": "learning", "x": 0, "y": 8, "w": 4, "h": 3},
        {"i": "activity", "x": 4, "y": 8, "w": 4, "h": 3},
        {"i": "quickactions", "x": 8, "y": 8, "w": 4, "h": 3},
    ]


def get_default_preferences(user_id: str) -> Dict[str, Any]:
    """Get default dashboard preferences for a user"""
    return {
        "user_id": user_id,
        "layout": get_default_layout(),
        "hidden_widgets": [],
        "favorite_widgets": ["security", "vulnerability", "activity"],
        "filters": {"project": "All", "severity": "All", "date": "7 Days"},
        "updated_at": datetime.utcnow().isoformat()
    }


@router.get("/preferences", response_model=DashboardPreferencesResponse)
async def get_preferences(current_user: Optional[dict] = Depends(get_optional_user)):
    """Get user's dashboard preferences"""
    user_id = "123"
    if current_user and isinstance(current_user, dict):
        user_id = str(current_user.get("_id") or current_user.get("id") or "123")

    doc = None
    try:
        if database is not None and hasattr(database, "dashboard_preferences"):
            doc = await database["dashboard_preferences"].find_one({"user_id": user_id})
    except Exception as e:
        fire_and_forget_log()
        print(f"MongoDB dashboard preferences fetch warning: {e}")

    if not doc:
        doc = get_default_preferences(user_id)
        try:
            if database is not None and hasattr(database, "dashboard_preferences"):
                await database["dashboard_preferences"].update_one(
                    {"user_id": user_id},
                    {"$set": doc},
                    upsert=True
                )
        except Exception as e:
            fire_and_forget_log()
            print(f"MongoDB dashboard preferences upsert warning: {e}")

    doc.pop("_id", None)
    return doc


@router.post("/preferences")
async def save_preferences(
    data: Dict[str, Any] = Body(...),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Save user's dashboard preferences"""
    user_id = "123"
    if current_user and isinstance(current_user, dict):
        user_id = str(current_user.get("_id") or current_user.get("id") or "123")

    # Ensure user_id is in the data
    data["user_id"] = user_id
    data["updated_at"] = datetime.utcnow().isoformat()

    try:
        if database is not None and hasattr(database, "dashboard_preferences"):
            await database["dashboard_preferences"].update_one(
                {"user_id": user_id},
                {"$set": data},
                upsert=True
            )
    except Exception as e:
        fire_and_forget_log()
        print(f"MongoDB dashboard preferences save warning: {e}")
        raise HTTPException(status_code=500, detail="Failed to save preferences")

    return {"message": "Preferences Saved"}


@router.delete("/preferences")
async def reset_preferences(current_user: Optional[dict] = Depends(get_optional_user)):
    """Reset user's dashboard preferences to defaults"""
    user_id = "123"
    if current_user and isinstance(current_user, dict):
        user_id = str(current_user.get("_id") or current_user.get("id") or "123")

    try:
        if database is not None and hasattr(database, "dashboard_preferences"):
            await database["dashboard_preferences"].delete_one({"user_id": user_id})
    except Exception as e:
        fire_and_forget_log()
        print(f"MongoDB dashboard preferences delete warning: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset preferences")

    return {"message": "Preferences Reset"}


# ── Security Events (Step 11 — Timeline, Live Feed) ──────────────────────────

@router.get("/events")
async def get_security_events(
    limit: int = Query(default=20, ge=1, le=100),
    severity: Optional[str] = Query(default=None),
    event_type: Optional[str] = Query(default=None),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """
    Return recent security events from MongoDB (newest first).
    Falls back to demo data when the collection is empty.
    """
    user_id: Optional[str] = None
    if current_user and isinstance(current_user, dict):
        user_id = str(current_user.get("_id") or current_user.get("id") or "")

    events = await event_service.get_recent_events(
        user_id=user_id,
        limit=limit,
        severity=severity,
        event_type=event_type,
    )
    return {"events": events, "total": len(events)}


# ── System Health (Step 9) ────────────────────────────────────────────────────

@router.get("/system-health")
async def get_system_health(
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """
    Return system resource metrics: CPU, memory, disk, uptime.
    Uses psutil when available, otherwise returns stable demo values.
    """
    health = await event_service.get_system_health()
    return health


# ── Broadcast helper (internal — used by other services) ─────────────────────

async def broadcast_event(
    type: str,
    title: str,
    description: str = "",
    project: str = "CyberShield",
    severity: str = "Info",
    user_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Convenience wrapper called by GitHub Scanner, Threat Analyzer, etc.
    to emit a security event and push it to all WebSocket clients.

    Example
    -------
    from app.dashboard.routes import broadcast_event
    await broadcast_event("scan_completed", "GitHub Scan Done", project="MyRepo", severity="High")
    """
    await event_service.create_event(
        type=type,
        title=title,
        description=description,
        project=project,
        severity=severity,
        user_id=user_id,
        metadata=metadata,
    )
