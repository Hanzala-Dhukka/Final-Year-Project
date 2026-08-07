"""
Security Checklist API routes (Module 6.1).

Endpoints:
  GET    /checklists                       -> list predefined checklists
  GET    /projects/{id}/checklists         -> user progress for a project
  PUT    /checklists/{id}/status           -> update a task's status (?project_id=)
  POST   /projects/{id}/generate-checklist -> generate a project-specific checklist
  GET    /projects/{id}/checklist-score    -> aggregated security score
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.dependencies.auth import get_current_user
from app.services import checklist_service as svc
from app.schemas.checklist_schema import (
    ChecklistItemOut,
    UserChecklistOut,
    StatusUpdateIn,
    GenerateChecklistIn,
    ChecklistScoreOut,
    GenerateChecklistOut,
    ScanRecommendationIn,
    ScanRecommendationOut,
    SecurityPostureOut,
    PostureHistoryOut,
)

router = APIRouter(prefix="/api/v1/checklist", tags=["Security Checklist"])


@router.get("", response_model=list[ChecklistItemOut])
async def list_checklists(current_user: dict = Depends(get_current_user)):
    """Return all predefined security hardening checklists."""
    items = await svc.get_all_checklists()
    return [
        ChecklistItemOut(
            id=it["id"],
            title=it["title"],
            category=it["category"],
            severity=it["severity"],
            description=it["description"],
            frameworks=it.get("frameworks", []),
            recommended=it.get("recommended", True),
        )
        for it in items
    ]


@router.get("/projects/{project_id}/checklists", response_model=list[UserChecklistOut])
async def project_checklists(project_id: str, current_user: dict = Depends(get_current_user)):
    """Return the current user's progress on a project's checklist."""
    progress = await svc.get_user_progress(str(current_user["_id"]), project_id)
    return [
        UserChecklistOut(
            id=p["id"] or "",
            checklist_id=p["checklist_id"],
            title=p["title"],
            category=p["category"],
            severity=p["severity"],
            description=p["description"],
            frameworks=p.get("frameworks", []),
            status=p["status"],
            completed_at=p.get("completed_at"),
            scan_id=p.get("scan_id"),
            recommended=p.get("recommended", False),
            matched_rule=p.get("matched_rule"),
        )
        for p in progress
    ]


@router.put("/checklists/{checklist_id}/status", status_code=200)
async def update_checklist_status(
    checklist_id: str,
    payload: StatusUpdateIn,
    project_id: str = Query(..., description="Project the task belongs to"),
    current_user: dict = Depends(get_current_user),
):
    """Update the status of a checklist item for the user + project."""
    try:
        result = await svc.update_status(
            str(current_user["_id"]), project_id, checklist_id, payload.status
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"status": payload.status, **result}


@router.post("/projects/{project_id}/generate-checklist", response_model=GenerateChecklistOut)
async def generate_checklist(
    project_id: str,
    payload: GenerateChecklistIn = GenerateChecklistIn(),
    current_user: dict = Depends(get_current_user),
):
    """Generate (seed) a project-specific security hardening checklist."""
    return await svc.generate_project_checklist(
        str(current_user["_id"]),
        project_id,
        finding=payload.finding,
        technology=payload.technology,
        scan_id=payload.scan_id,
    )


@router.get("/projects/{project_id}/checklist-score", response_model=ChecklistScoreOut)
async def checklist_score(project_id: str, current_user: dict = Depends(get_current_user)):
    """Return the aggregated security score and per-category breakdown."""
    return await svc.get_project_score(str(current_user["_id"]), project_id)


# ── Scanner Integration Routes (Module SC1) ──────────────────────────────────

@router.post("/projects/{project_id}/scan-recommendation", response_model=ScanRecommendationOut)
async def add_scan_recommendation(
    project_id: str,
    payload: ScanRecommendationIn,
    current_user: dict = Depends(get_current_user),
):
    """Create or update a checklist item recommended by the scanner.

    Module SC1: Used by the scanner integration to push recommendations
    into the checklist after a GitHub scan completes.
    """
    try:
        result = await svc.add_scan_recommendation(
            user_id=str(current_user["_id"]),
            project_id=project_id,
            checklist_id=payload.checklist_id,
            scan_id=payload.scan_id,
            matched_rule=payload.matched_rule,
            status=payload.status,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ScanRecommendationOut(
        checklist_id=payload.checklist_id,
        scan_id=payload.scan_id,
        matched_rule=payload.matched_rule,
        recommended=True,
        status=payload.status,
        matched=result["matched"],
        upserted=result["upserted"],
    )


@router.get("/projects/{project_id}/scan-recommendations/{scan_id}")
async def get_scan_recommendations(
    project_id: str,
    scan_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Return all checklist items recommended by a specific scan."""
    rows = await svc.get_scan_recommendations(
        str(current_user["_id"]), project_id, scan_id
    )
    return {
        "scan_id": scan_id,
        "count": len(rows),
        "recommendations": [
            {
                "checklist_id": r.get("checklist_id"),
                "status": r.get("status"),
                "matched_rule": r.get("matched_rule"),
                "scan_id": r.get("scan_id"),
                "recommended": r.get("recommended", True),
            }
            for r in rows
        ],
    }


# ── Security Posture (Module SC4) ────────────────────────────────────────────

@router.get("/projects/{project_id}/security-posture", response_model=SecurityPostureOut)
async def get_security_posture(project_id: str, current_user: dict = Depends(get_current_user)):
    """Calculate the intelligent security posture for a project.

    Uses risk-weighted scoring: Critical=20, High=10, Medium=5, Low=2.
    Returns overall score, security level, per-category breakdown,
    and risk reduction metrics.
    """
    from app.services.scoring_service import calculate_posture, save_posture_snapshot

    tasks = await svc.get_user_progress(str(current_user["_id"]), project_id)
    posture = calculate_posture(tasks)

    # Persist snapshot for history
    await save_posture_snapshot(str(current_user["_id"]), project_id, posture)

    return SecurityPostureOut(**posture)


@router.get("/projects/{project_id}/posture-history", response_model=list[PostureHistoryOut])
async def get_posture_history(
    project_id: str,
    limit: int = Query(default=30, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """Get historical posture snapshots for trend analysis."""
    from app.services.scoring_service import get_posture_history

    docs = await get_posture_history(str(current_user["_id"]), project_id, limit=limit)
    return [PostureHistoryOut(**doc) for doc in docs]
