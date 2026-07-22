"""
WebSocket Connection Manager for CyberShield real-time dashboard.

Supports:
- Global broadcast to every connected client
- Per-user targeted messages (room = user_id string)
- Graceful stale-connection cleanup on send failure
"""
from __future__ import annotations

import asyncio
from typing import Dict, List, Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        # All active connections
        self._connections: List[WebSocket] = []
        # user_id → list of that user's sockets (for targeted delivery)
        self._rooms: Dict[str, List[WebSocket]] = {}
        self._lock = asyncio.Lock()

    # ── Connection lifecycle ──────────────────────────────────────────────────

    async def connect(self, websocket: WebSocket, user_id: str | None = None) -> None:
        """Accept and register a WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            self._connections.append(websocket)
            if user_id:
                self._rooms.setdefault(user_id, []).append(websocket)

    async def disconnect(self, websocket: WebSocket, user_id: str | None = None) -> None:
        """Remove a WebSocket connection from all registries."""
        async with self._lock:
            self._connections = [c for c in self._connections if c is not websocket]
            if user_id and user_id in self._rooms:
                self._rooms[user_id] = [
                    c for c in self._rooms[user_id] if c is not websocket
                ]
                if not self._rooms[user_id]:
                    del self._rooms[user_id]

    # ── Broadcasting ──────────────────────────────────────────────────────────

    async def broadcast(self, data: Dict[str, Any]) -> None:
        """Send a message to every connected client."""
        stale: List[WebSocket] = []
        for ws in list(self._connections):
            try:
                await ws.send_json(data)
            except Exception:
                stale.append(ws)
        for ws in stale:
            await self.disconnect(ws)

    async def send_to_user(self, user_id: str, data: Dict[str, Any]) -> None:
        """Send a message only to connections belonging to a specific user."""
        sockets = list(self._rooms.get(user_id, []))
        stale: List[WebSocket] = []
        for ws in sockets:
            try:
                await ws.send_json(data)
            except Exception:
                stale.append(ws)
        for ws in stale:
            await self.disconnect(ws, user_id)

    # ── Diagnostics ───────────────────────────────────────────────────────────

    @property
    def connection_count(self) -> int:
        return len(self._connections)

    @property
    def connected_users(self) -> List[str]:
        return list(self._rooms.keys())


# Singleton shared across the whole application
manager = ConnectionManager()
