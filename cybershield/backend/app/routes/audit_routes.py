"""
Audit routes for admin audit log viewing.
"""
from fastapi import APIRouter, HTTPException, Depends

from app.repositories.audit_repository import audit_repository
from app.services.audit_service import get_user_audit_history, get_all_audit_logs
from app.dependencies.auth import get_current_user

router = APIRouter()


@router.get("/audit/logs")
def get_audit_logs(
    current_user=Depends(get_current_user),
    limit: int = 100
):
    """
    Get all audit logs (admin only).
    
    Response:
    [
        {
            "user": "admin",
            "action": "LOGIN",
            "time": "2026-07-08"
        }
    ]
    """
    # Check if user is admin
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    
    logs = get_all_audit_logs(limit)
    
    return [
        {
            "id": log["_id"],
            "user_id": log["user_id"],
            "username": log["username"],
            "action": log["action"],
            "module": log["module"],
            "description": log["description"],
            "ip_address": log.get("ip_address"),
            "status": log["status"],
            "created_at": log["created_at"]
        }
        for log in logs
    ]


@router.get("/audit/my-history")
def get_my_audit_history(
    current_user=Depends(get_current_user),
    limit: int = 50
):
    """
    Get audit history for the current user.
    
    Response:
    [
        {
            "action": "QUIZ_COMPLETED",
            "score": 90,
            "date": "2026-07-08"
        }
    ]
    """
    user_id = str(current_user["_id"])
    logs = get_user_audit_history(user_id, limit)
    
    return [
        {
            "id": log["_id"],
            "action": log["action"],
            "module": log["module"],
            "description": log["description"],
            "status": log["status"],
            "created_at": log["created_at"]
        }
        for log in logs
    ]