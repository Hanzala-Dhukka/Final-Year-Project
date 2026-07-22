from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Body, HTTPException, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Dict, Any, Optional
from datetime import datetime
from jose import jwt

from app.database.db import database
from app.config.settings import settings
from app.repositories.user_repository import user_repository
from app.models.dashboard_preferences import DashboardPreferencesResponse, LayoutItem, DashboardFilters

# Use the shared WebSocket manager and event service
from app.websocket.manager import manager
from app.services.event_service import event_service

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
            user = await user_repository.find_by_id(user_id)
            if user:
                return user
            return {"_id": str(user_id), "username": payload.get("username", "Hanzala")}
    except Exception:
        pass
    return None


def get_default_dashboard_data(user_id: str = "123", username: str = "Hanzala") -> Dict[str, Any]:
    return {
        "user_id": user_id,
        "username": username,
        "security_score": 82,
        "projects": 6,
        "scans": 41,
        "threats": 7,
        "critical": 2,
        "high": 5,
        "medium": 9,
        "low": 21,
        "weekly_scans": [
            {"day": "Mon", "count": 5},
            {"day": "Tue", "count": 8},
            {"day": "Wed", "count": 6},
            {"day": "Thu", "count": 12},
            {"day": "Fri", "count": 9},
            {"day": "Sat", "count": 4},
            {"day": "Sun", "count": 7}
        ],
        "vulnerability_trend": [
            {"day": "Mon", "critical": 1, "high": 3, "medium": 5, "low": 10},
            {"day": "Tue", "critical": 2, "high": 4, "medium": 7, "low": 12},
            {"day": "Wed", "critical": 1, "high": 2, "medium": 6, "low": 15},
            {"day": "Thu", "critical": 3, "high": 5, "medium": 8, "low": 18},
            {"day": "Fri", "critical": 2, "high": 4, "medium": 9, "low": 20},
            {"day": "Sat", "critical": 1, "high": 3, "medium": 7, "low": 16},
            {"day": "Sun", "critical": 2, "high": 5, "medium": 9, "low": 21}
        ],
        "learning_progress": 65,
        "xp": 1820,
        "rank": "Silver",
        "level": 4,
        "next_level_xp": 2500,
        "achievements": [
            {"id": "1", "title": "GitHub Scanner Expert", "description": "Completed 10+ GitHub repository scans", "unlocked": True, "icon": "🔍"},
            {"id": "2", "title": "OWASP Beginner", "description": "Completed top 3 OWASP Top 10 labs", "unlocked": True, "icon": "🛡️"},
            {"id": "3", "title": "Quiz Master", "description": "Scored 100% on 5 security quizzes", "unlocked": True, "icon": "🎓"},
            {"id": "4", "title": "Threat Hunter", "description": "Generated 5 comprehensive threat models", "unlocked": False, "icon": "🎯"}
        ],
        "ai_insight": {
            "title": "Enable MFA & Rotate Access Tokens",
            "description": "Your GitHub access token expires in 3 days. Enable MFA to safeguard core repositories.",
            "priority": "Medium"
        },
        "recent_activity": [
            {"title": "GitHub Scan Completed", "time": "10:32 AM", "timestamp": "2 minutes ago", "type": "scan"},
            {"title": "Quiz Completed - OWASP A01", "time": "09:15 AM", "timestamp": "1 hour ago", "type": "quiz"},
            {"title": "Threat Model Generated", "time": "Yesterday", "timestamp": "Yesterday", "type": "threat"}
        ],
        "last_scan_time": "10:32 AM",
        "updated_at": datetime.utcnow().strftime("%I:%M %p")
    }


@router.get("/overview")
@router.get("/")
@router.get("")
async def get_dashboard(current_user: Optional[dict] = Depends(get_optional_user)):
    user_id = "123"
    username = "Hanzala"
    if current_user and isinstance(current_user, dict):
        user_id = str(current_user.get("_id") or current_user.get("id") or "123")
        username = current_user.get("username") or current_user.get("email", "").split("@")[0] or "Hanzala"

    doc = None
    try:
        if database is not None and hasattr(database, "dashboard"):
            doc = await database["dashboard"].find_one({"user_id": user_id})
    except Exception as e:
        print(f"MongoDB dashboard fetch warning: {e}")

    if not doc:
        doc = get_default_dashboard_data(user_id=user_id, username=username)
        try:
            if database is not None and hasattr(database, "dashboard"):
                await database["dashboard"].update_one(
                    {"user_id": user_id},
                    {"$set": doc},
                    upsert=True
                )
        except Exception as e:
            print(f"MongoDB dashboard upsert warning: {e}")

    # Remove mongo _id from dict if present
    doc.pop("_id", None)
    return doc


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
