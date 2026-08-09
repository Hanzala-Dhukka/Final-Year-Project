"""
SC5 API Routes — AI-Assisted Recommendations & Score Tracking.

Endpoints:
  POST /api/v1/sc5/{project_id}/generate-from-findings  → AI-generate checklist from scan findings
  GET  /api/v1/sc5/{project_id}/score-history           → score improvement history
  GET  /api/v1/sc5/{project_id}/improvement             → before/after improvement summary
  POST /api/v1/sc5/{project_id}/track-completion        → record score after task completion
"""

from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.dependencies.auth import get_current_user
from app.database.db import database
from app.services.checklist_service import get_user_progress
from app.models.checklist_model import build_user_checklist_doc, get_risk_weight

from .ai_recommendation import generate_batch_recommendations
from .score_tracker import (
    get_score_history,
    get_improvement_summary,
    track_task_completion,
)

router = APIRouter(prefix="/api/v1/sc5", tags=["SC5 AI Recommendations"])


# ── Request / Response Models ─────────────────────────────────────────────────

class GenerateFromFindingsIn(BaseModel):
    """Request body for generating checklist from scan findings."""
    scan_id: str
    findings: Optional[List[Dict[str, Any]]] = None  # optional override


class GeneratedTaskOut(BaseModel):
    """A single AI-generated task."""
    task: str
    category: str
    priority: str
    reason: str
    impact_score: int
    source: str
    source_finding: str


class ScoreHistoryOut(BaseModel):
    """A single score history entry."""
    id: str
    score: float
    level: str
    risk_reduced: int = 0
    risk_remaining: int = 0
    reason: str = ""
    task_title: str = ""
    task_severity: str = ""
    created_at: Optional[str] = None


class ImprovementOut(BaseModel):
    """Before/after improvement summary."""
    has_data: bool = False
    old_score: float = 0
    old_level: str = ""
    new_score: float = 0
    new_level: str = ""
    improvement: float = 0
    tasks_completed: int = 0
    history_count: int = 0


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/{project_id}/generate-from-findings")
async def generate_from_findings(
    project_id: str,
    payload: GenerateFromFindingsIn,
    current_user: dict = Depends(get_current_user),
):
    """Generate checklist tasks from scan findings using AI + rule engine.

    Reads findings from scanner collections if not provided in payload.
    Creates user_checklist entries with deduplication.
    """
    user_id = str(current_user["_id"])

    # Read findings from scanner if not provided
    findings = payload.findings
    if not findings:
        from app.recommendation.service import read_scan_findings
        findings = await read_scan_findings(payload.scan_id)

    if not findings:
        return {
            "scan_id": payload.scan_id,
            "count": 0,
            "tasks": [],
            "message": "No findings found for this scan.",
        }

    # Generate AI/rule-based recommendations
    recommendations = await generate_batch_recommendations(findings)

    created = []
    for rec in recommendations:
        # Deduplicate: check if this source_finding already has a pending task
        existing = await database["user_checklists"].find_one({
            "user_id": user_id,
            "project_id": project_id,
            "source_finding": rec["source_finding"],
        })
        if existing:
            continue

        # Create checklist entry
        doc = {
            "user_id": user_id,
            "project_id": project_id,
            "checklist_id": f"SC5_{rec['source_finding'].replace(' ', '_').upper()}",
            "status": "pending",
            "completed_at": None,
            "created_at": __import__("datetime").datetime.utcnow(),
            "updated_at": __import__("datetime").datetime.utcnow(),
            # Scanner fields (SC1)
            "scan_id": payload.scan_id,
            "recommended": True,
            "matched_rule": f"SC5_{rec['source_finding']}",
            # SC5 fields
            "title": rec["task"],
            "category": rec["category"],
            "severity": rec["priority"],
            "description": rec.get("reason", rec["task"]),
            "source": rec["source"],
            "source_finding": rec["source_finding"],
            "impact_score": rec["impact_score"],
            "file": rec.get("file", ""),
            "risk_weight": get_risk_weight(rec["priority"]),
        }

        await database["user_checklists"].insert_one(doc)
        created.append({
            "task": rec["task"],
            "category": rec["category"],
            "priority": rec["priority"],
            "reason": rec.get("reason", ""),
            "impact_score": rec["impact_score"],
            "source": rec["source"],
            "source_finding": rec["source_finding"],
        })

    return {
        "scan_id": payload.scan_id,
        "count": len(created),
        "tasks": created,
        "message": f"{len(created)} AI-powered checklist tasks generated.",
    }


@router.get("/{project_id}/score-history", response_model=list[ScoreHistoryOut])
async def score_history(
    project_id: str,
    limit: int = Query(default=30, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """Get score improvement history for a project."""
    docs = await get_score_history(str(current_user["_id"]), project_id, limit)
    return [ScoreHistoryOut(**{**doc, "id": doc.get("_id") or doc.get("id", "")}) for doc in docs]


@router.get("/{project_id}/improvement", response_model=ImprovementOut)
async def improvement_summary(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get before/after score improvement summary."""
    return await get_improvement_summary(str(current_user["_id"]), project_id)


@router.post("/{project_id}/track-completion")
async def track_completion(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Record a score snapshot after task completion.

    Called automatically when a checklist task is toggled.
    """
    user_id = str(current_user["_id"])
    tasks = await get_user_progress(user_id, project_id)
    snapshot = await track_task_completion(user_id, project_id, tasks)
    if snapshot:
        snapshot = {
            "score": snapshot.get("score"),
            "level": snapshot.get("level"),
            "risk_reduced": snapshot.get("risk_reduced"),
            "risk_remaining": snapshot.get("risk_remaining"),
            "reason": snapshot.get("reason") or "",
            "task_title": snapshot.get("task_title") or "",
            "task_severity": snapshot.get("task_severity") or "",
            "created_at": snapshot.get("created_at").isoformat()
            if isinstance(snapshot.get("created_at"), datetime) else None,
        }
    return {
        "recorded": snapshot is not None,
        "snapshot": snapshot,
    }
