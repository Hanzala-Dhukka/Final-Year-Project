"""
Workspace routes (Module 4.5) — reports, comments, activity, audit.
"""
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies.auth import get_current_user
from app.schemas.workspace_schema import ReportCreate, CommentCreate
from app.services import workspace_service as svc

router = APIRouter()


# ── Reports / versions ───────────────────────────────────────────────────────
@router.get("/{project_id}/reports")
async def list_reports(project_id: str, user=Depends(get_current_user)):
    try:
        return await svc.list_reports(user, project_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/{project_id}/reports", status_code=201)
async def create_report(project_id: str, payload: ReportCreate, user=Depends(get_current_user)):
    try:
        return await svc.create_report(user, project_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/{project_id}/reports/{version}")
async def get_version(project_id: str, version: int, user=Depends(get_current_user)):
    try:
        return await svc.get_report_version(user, project_id, version)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


# ── Comments ──────────────────────────────────────────────────────────────────
@router.post("/reports/{report_id}/comments", status_code=201)
async def add_comment(report_id: str, payload: CommentCreate, user=Depends(get_current_user)):
    try:
        return await svc.add_comment(user, report_id, payload.content)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/reports/{report_id}/comments")
async def get_comments(report_id: str):
    return await svc.list_comments(report_id)


@router.delete("/comments/{comment_id}", status_code=204)
async def delete_comment(comment_id: str, user=Depends(get_current_user)):
    try:
        await svc.delete_comment(user, comment_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


# ── Activity & audit ──────────────────────────────────────────────────────────
@router.get("/{project_id}/timeline")
async def timeline(project_id: str, user=Depends(get_current_user)):
    try:
        return await svc.get_timeline(user, project_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/{project_id}/audit")
async def audit(project_id: str, user=Depends(get_current_user)):
    try:
        return await svc.get_audit(user, project_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
