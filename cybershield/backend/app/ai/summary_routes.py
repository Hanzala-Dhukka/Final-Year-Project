"""
AI Scan Summary API routes (Module E3, Step 5).

Endpoints:
  POST /ai/scan-summary   Generate an AI executive summary from scan data
  GET  /ai/scan-summary/{scan_id}  Retrieve a stored scan summary
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from app.ai.scan_summary import (
    generate_scan_summary,
    save_scan_summary,
    get_scan_summary,
)

router = APIRouter(prefix="/ai", tags=["AI Summary"])


@router.post("/scan-summary")
async def scan_summary(data: Dict[str, Any]):
    """
    Generate an AI executive summary from scan data.

    Body:
        critical: int
        high: int
        medium: int
        low: int
        score: int (security score)
        findings: list (optional, detailed findings)
    """
    result = await generate_scan_summary(data)
    return result


@router.get("/scan-summary/{scan_id}")
async def get_summary(scan_id: str):
    """Retrieve a stored AI scan summary by scan ID."""
    summary = await get_scan_summary(scan_id)
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found for this scan")
    return summary
