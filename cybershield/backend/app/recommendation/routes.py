"""
Recommendation API routes (Module SC3).

Endpoints:
  POST /api/v1/recommendations/{project_id}/generate  → generate recommendations from a scan
  GET  /api/v1/recommendations/{project_id}            → get all recommendations for a project
  GET  /api/v1/recommendations/{project_id}/stats      → get recommendation statistics
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional

from app.dependencies.auth import get_current_user
from .service import create_recommendations, get_recommendations, get_recommendation_stats
from app.services.error_log_service import fire_and_forget_log

router = APIRouter(prefix="/api/v1/recommendations", tags=["Scanner Recommendations"])


# ── Request / Response models ────────────────────────────────────────────────

class GenerateRecommendationsIn(BaseModel):
    """Request body for generating recommendations from a scan."""
    scan_id: str


class RecommendationOut(BaseModel):
    """A single recommendation."""
    checklist_rule: str
    task: str
    category: str
    severity: str
    source: str = "SCAN_RECOMMENDATION"
    linked_finding: str = ""


class RecommendationStatsOut(BaseModel):
    """Summary statistics for recommendations."""
    total: int = 0
    completed: int = 0
    pending: int = 0
    by_severity: dict = {}


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/{project_id}/generate")
async def generate_recommendations(
    project_id: str,
    payload: GenerateRecommendationsIn,
    current_user: dict = Depends(get_current_user),
):
    """Generate checklist recommendations from scan findings.

    Reads findings from the scanner collections, maps them through the
    Rule Engine (SC2), and creates user_checklist entries (SC1 schema)
    with scanner fields populated.
    """
    try:
        created = await create_recommendations(
            scan_id=payload.scan_id,
            user_id=str(current_user["_id"]),
            project_id=project_id,
        )
    except Exception as e:
        fire_and_forget_log()
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {e}")

    return {
        "scan_id": payload.scan_id,
        "project_id": project_id,
        "count": len(created),
        "message": f"{len(created)} checklist recommendations generated from scan.",
        "recommendations": created,
    }


@router.get("/{project_id}", response_model=list[RecommendationOut])
async def list_recommendations(
    project_id: str,
    scan_id: Optional[str] = Query(None, description="Filter by specific scan_id"),
    current_user: dict = Depends(get_current_user),
):
    """Get all scan-recommended checklist items for a project."""
    docs = await get_recommendations(
        user_id=str(current_user["_id"]),
        project_id=project_id,
        scan_id=scan_id,
    )
    return [
        RecommendationOut(
            checklist_rule=d.get("matched_rule", d.get("checklist_id", "")),
            task=d.get("title", d.get("task", "")),
            category=d.get("category", ""),
            severity=d.get("severity", ""),
            source=d.get("source", "SCAN_RECOMMENDATION"),
            linked_finding=d.get("linked_finding", ""),
        )
        for d in docs
    ]


@router.get("/{project_id}/stats", response_model=RecommendationStatsOut)
async def recommendation_stats(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get summary statistics for scan recommendations."""
    return await get_recommendation_stats(
        user_id=str(current_user["_id"]),
        project_id=project_id,
    )
