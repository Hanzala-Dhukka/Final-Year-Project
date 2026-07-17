"""
Collaboration routes (Module 4.5) — version compare & secure sharing.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.dependencies.auth import get_current_user
from app.schemas.workspace_schema import ShareCreate
from app.services import collaboration_service as svc

router = APIRouter()


@router.post("/{project_id}/compare")
async def compare(project_id: str, version_a: int, version_b: int,
                  user=Depends(get_current_user)):
    try:
        return await svc.compare_versions(user, project_id, version_a, version_b)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/{project_id}/reports/{report_id}/share", status_code=201)
async def create_share(project_id: str, report_id: str, payload: ShareCreate,
                       user=Depends(get_current_user)):
    try:
        return await svc.create_share(
            user, report_id, payload.expires_in_days, payload.password
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/share/{token}")
async def shared_report(token: str, password: str = Query(None)):
    try:
        return await svc.get_shared_report(token, password)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/share/{token}", status_code=204)
async def revoke(token: str, user=Depends(get_current_user)):
    try:
        await svc.revoke_share(user, token)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
