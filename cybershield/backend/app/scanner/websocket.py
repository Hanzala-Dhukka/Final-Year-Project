"""
Scanner WebSocket — dedicated WebSocket endpoint for real-time scan updates.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import manager

router = APIRouter()


@router.websocket("/ws/scanner")
async def scanner_websocket(websocket: WebSocket):
    """
    Global scanner WebSocket. Clients connect here to receive real-time
    scan progress, timeline events, and log entries for ALL their scans.
    """
    await manager.connect(websocket)
    try:
        await websocket.send_json({
            "type": "connected",
            "message": "Scanner WebSocket connected",
        })
        # Keep connection alive — receive pings / client messages
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)
