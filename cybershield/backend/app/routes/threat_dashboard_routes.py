"""
Routes for the Interactive Threat Modeling Dashboard (Module 4.4).
"""
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies.auth import get_current_user
from app.schemas.threat_dashboard_schema import (
    CompareRequest,
    CompareResponse,
    ThreatDashboardResponse,
)
from app.services.threat_dashboard_service import (
    get_dashboard_data,
    get_risk_history,
    get_user_reports,
    compare_reports,
)

router = APIRouter()


@router.get("/reports")
async def list_reports(user=Depends(get_current_user)):
    """List the current user's threat reports (dashboard picker)."""
    reports = await get_user_reports(str(user.get("_id")))
    return reports


@router.get("/history")
async def risk_history(user=Depends(get_current_user)):
    """Risk trend across the user's reports."""
    return await get_risk_history(str(user.get("_id")))


@router.post("/compare", response_model=CompareResponse)
async def compare(payload: CompareRequest, user=Depends(get_current_user)):
    """Compare two threat reports."""
    if not payload.report_a or not payload.report_b:
        raise HTTPException(status_code=400, detail="Both report ids are required")
    return await compare_reports(payload.report_a, payload.report_b, user)


@router.get("/{report_id}", response_model=ThreatDashboardResponse)
async def dashboard(report_id: str, user=Depends(get_current_user)):
    """Full interactive dashboard data for a single report."""
    return await get_dashboard_data(report_id, user)
