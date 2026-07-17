"""
Project routes (Module 4.5).
"""
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies.auth import get_current_user
from app.schemas.project_schema import ProjectCreate, ProjectUpdate, MemberInvite
from app.services import project_service as svc

router = APIRouter()


@router.post("", status_code=201)
async def create(payload: ProjectCreate, user=Depends(get_current_user)):
    try:
        return await svc.create_project(user, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
async def list_projects(user=Depends(get_current_user)):
    return await svc.list_projects(user)


@router.get("/{project_id}")
async def get_project(project_id: str, user=Depends(get_current_user)):
    try:
        return await svc.get_project(user, project_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.put("/{project_id}")
async def update(project_id: str, payload: ProjectUpdate, user=Depends(get_current_user)):
    try:
        return await svc.update_project(user, project_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.delete("/{project_id}", status_code=204)
async def delete(project_id: str, user=Depends(get_current_user)):
    try:
        await svc.delete_project(user, project_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{project_id}/members", status_code=201)
async def invite(project_id: str, payload: MemberInvite, user=Depends(get_current_user)):
    try:
        return await svc.invite_member(
            user, project_id, payload.user_id, payload.email, payload.role
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/{project_id}/members")
async def members(project_id: str, user=Depends(get_current_user)):
    try:
        return await svc.list_members(user, project_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.delete("/{project_id}/members/{target_user_id}", status_code=204)
async def remove_member(project_id: str, target_user_id: str, user=Depends(get_current_user)):
    try:
        await svc.remove_member(user, project_id, target_user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
