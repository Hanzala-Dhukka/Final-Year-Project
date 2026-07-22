"""
Event Service — persists security events to MongoDB and broadcasts them
via the WebSocket manager so every connected dashboard client receives
live updates instantly.

Usage (from any backend service)
──────────────────────────────────
    from app.services.event_service import event_service

    await event_service.create_event(
        type="scan_completed",
        title="GitHub Scan Completed",
        description="Found 2 critical issues in repo CyberShield",
        project="CyberShield",
        severity="Critical",
        user_id=user_id,
        metadata={"critical": 2, "high": 5},
    )
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.database.db import database
from app.websocket.manager import manager

COLLECTION = "security_events"


class EventService:
    # ── Write ─────────────────────────────────────────────────────────────────

    async def create_event(
        self,
        *,
        type: str,
        title: str,
        description: str = "",
        project: str = "CyberShield",
        severity: str = "Info",
        user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Persist a security event and broadcast it over WebSocket.

        Returns the inserted document (with string _id → id).
        """
        now = datetime.now(timezone.utc)
        doc: Dict[str, Any] = {
            "type":        type,
            "title":       title,
            "description": description,
            "project":     project,
            "severity":    severity,
            "user_id":     user_id,
            "metadata":    metadata or {},
            "created_at":  now,
        }

        # Persist to MongoDB (best-effort — never crash the caller)
        inserted_id: Optional[str] = None
        try:
            result = await database[COLLECTION].insert_one(doc)
            inserted_id = str(result.inserted_id)
        except Exception as exc:
            print(f"[EventService] MongoDB insert warning: {exc}")

        # Build broadcast payload
        payload: Dict[str, Any] = {
            "event":       type,
            "id":          inserted_id or "",
            "title":       title,
            "description": description,
            "project":     project,
            "severity":    severity,
            "timestamp":   now.strftime("%I:%M %p"),
            "metadata":    metadata or {},
        }

        # Broadcast to ALL dashboard clients
        try:
            await manager.broadcast(payload)
        except Exception as exc:
            print(f"[EventService] Broadcast warning: {exc}")

        # Also send targeted message to the specific user if user_id is known
        if user_id:
            try:
                await manager.send_to_user(user_id, {**payload, "targeted": True})
            except Exception as exc:
                print(f"[EventService] Targeted send warning: {exc}")

        return {**doc, "id": inserted_id or ""}

    # ── Read ──────────────────────────────────────────────────────────────────

    async def get_recent_events(
        self,
        *,
        user_id: Optional[str] = None,
        limit: int = 20,
        severity: Optional[str] = None,
        event_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch recent security events from MongoDB, newest first.

        Filters user_id if provided (also includes global events where user_id is null).
        """
        query: Dict[str, Any] = {}
        if user_id:
            query["$or"] = [{"user_id": user_id}, {"user_id": None}]
        if severity:
            query["severity"] = severity
        if event_type:
            query["type"] = event_type

        events: List[Dict[str, Any]] = []
        try:
            cursor = (
                database[COLLECTION]
                .find(query)
                .sort("created_at", -1)
                .limit(limit)
            )
            async for doc in cursor:
                doc["id"] = str(doc.pop("_id"))
                if isinstance(doc.get("created_at"), datetime):
                    doc["created_at"] = doc["created_at"].isoformat()
                events.append(doc)
        except Exception as exc:
            print(f"[EventService] Fetch warning: {exc}")

        # Fall back to demo data so the UI always has something
        if not events:
            events = _demo_events()

        return events

    async def get_system_health(self) -> Dict[str, Any]:
        """
        Return current system health metrics.
        In production, plug in psutil or a monitoring agent here.
        """
        try:
            import psutil  # optional dependency
            cpu    = psutil.cpu_percent(interval=0.1)
            mem    = psutil.virtual_memory().percent
            disk   = psutil.disk_usage("/").percent
        except Exception:
            cpu, mem, disk = 42, 63, 58  # sensible demo values

        # Simple uptime from process start (approximate)
        uptime = _get_uptime_string()

        return {
            "cpu":    round(cpu),
            "memory": round(mem),
            "disk":   round(disk),
            "uptime": uptime,
            "status": "healthy" if cpu < 85 and mem < 85 else "warning",
        }


# ── Helpers ───────────────────────────────────────────────────────────────────

_START_TIME = datetime.now(timezone.utc)


def _get_uptime_string() -> str:
    delta = datetime.now(timezone.utc) - _START_TIME
    days    = delta.days
    hours   = delta.seconds // 3600
    minutes = (delta.seconds % 3600) // 60
    if days:
        return f"{days}d {hours}h {minutes}m"
    if hours:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


def _demo_events() -> List[Dict[str, Any]]:
    now = datetime.now(timezone.utc)
    return [
        {
            "id": "demo-1",
            "type": "scan_completed",
            "title": "GitHub Scan Completed",
            "description": "Found 2 critical issues in CyberShield repo",
            "project": "CyberShield",
            "severity": "Critical",
            "user_id": None,
            "created_at": now.isoformat(),
        },
        {
            "id": "demo-2",
            "type": "secret_found",
            "title": "AWS Key Detected",
            "description": "Exposed AWS access key in config.py",
            "project": "CyberShield",
            "severity": "Critical",
            "user_id": None,
            "created_at": now.isoformat(),
        },
        {
            "id": "demo-3",
            "type": "vulnerability",
            "title": "SQL Injection Risk",
            "description": "Unparameterized query found in user_routes.py",
            "project": "Project A",
            "severity": "High",
            "user_id": None,
            "created_at": now.isoformat(),
        },
        {
            "id": "demo-4",
            "type": "quiz_completed",
            "title": "Quiz Completed — OWASP A01",
            "description": "Score: 95%",
            "project": "Learning",
            "severity": "Info",
            "user_id": None,
            "created_at": now.isoformat(),
        },
        {
            "id": "demo-5",
            "type": "report_generated",
            "title": "Threat Report Generated",
            "description": "Executive summary ready for CyberShield",
            "project": "CyberShield",
            "severity": "Medium",
            "user_id": None,
            "created_at": now.isoformat(),
        },
    ]


# Module-level singleton
event_service = EventService()
