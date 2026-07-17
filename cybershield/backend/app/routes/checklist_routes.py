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
    )


@router.get("/projects/{project_id}/checklist-score", response_model=ChecklistScoreOut)
async def checklist_score(project_id: str, current_user: dict = Depends(get_current_user)):
    """Return the aggregated security score and per-category breakdown."""
    return await svc.get_project_score(str(current_user["_id"]), project_id)
