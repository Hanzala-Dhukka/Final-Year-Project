"""
AI-powered dynamic security checklist API routes (Module 6.2).

Endpoints:
  POST /ai/checklist/generate      -> generate a project-specific checklist
  GET  /ai/checklist/{project_id}  -> latest checklist (sorted by priority)
  POST /ai/checklist/regenerate    -> create a new version
  DELETE /ai/checklist/{id}         -> delete a stored checklist
  PUT  /ai/checklist/{id}/items/{index}/complete -> toggle item completion
"""
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies.auth import get_current_user
from app.services import ai_checklist_service as svc
from app.schemas.ai_checklist_schema import (
    GenerateChecklistIn,
    RegenerateChecklistIn,
    GenerateChecklistOut,
)

router = APIRouter(prefix="/api/v1/ai/checklist", tags=["AI Checklist"])


@router.post("/generate", response_model=GenerateChecklistOut)
async def generate_checklist(
    payload: GenerateChecklistIn,
    current_user: dict = Depends(get_current_user),
):
    """Generate an AI-powered, project-specific security checklist."""
    try:
        result = await svc.generate_project_checklist(
            str(current_user["_id"]), payload.project_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return GenerateChecklistOut(
        project_id=result["project_id"],
        generated_by=result["generated_by"],
        risk_score=result["risk_score"],
        estimated_risk_after=result["estimated_risk_after"],
        items=result["items"],
        ai_summary=result["ai_summary"],
        message="AI checklist generated.",
    )


@router.get("/{project_id}", response_model=GenerateChecklistOut)
async def get_latest_checklist(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Return the latest generated checklist for a project."""
    doc = await svc.get_latest_checklist(project_id)
    if not doc:
        raise HTTPException(status_code=404, detail="No generated checklist found for this project.")
    return GenerateChecklistOut(
        project_id=doc["project_id"],
        generated_by=doc["generated_by"],
        risk_score=doc["risk_score"],
        estimated_risk_after=doc["estimated_risk_after"],
        items=doc["items"],
        ai_summary=doc["ai_summary"],
        message="Latest checklist returned.",
    )


@router.post("/regenerate", response_model=GenerateChecklistOut)
async def regenerate_checklist(
    payload: RegenerateChecklistIn,
    current_user: dict = Depends(get_current_user),
):
    """Regenerate (create a new version of) the project's AI checklist."""
    try:
        result = await svc.generate_project_checklist(
            str(current_user["_id"]), payload.project_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return GenerateChecklistOut(
        project_id=result["project_id"],
        generated_by=result["generated_by"],
        risk_score=result["risk_score"],
        estimated_risk_after=result["estimated_risk_after"],
        items=result["items"],
        ai_summary=result["ai_summary"],
        message="AI checklist regenerated (new version created).",
    )


@router.delete("/{checklist_id}")
async def delete_checklist(
    checklist_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a stored generated checklist."""
    deleted = await svc.delete_checklist(checklist_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Checklist not found.")
    return {"deleted": True, "id": checklist_id}


@router.put("/{checklist_id}/items/{item_index}/complete")
async def mark_item_complete(
    checklist_id: str,
    item_index: int,
    current_user: dict = Depends(get_current_user),
    completed: bool = True,
):
    """Toggle completion of a generated checklist item and sync Module 6.1 progress."""
    try:
        return await svc.mark_item_complete(
            str(current_user["_id"]),
            # project_id reconstructed from the checklist doc inside the service
            "",  # service looks up project_id from the doc
            checklist_id,
            item_index,
            completed,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
