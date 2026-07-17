"""
AI Remediation Engine API routes (Module 5.4).

Mounted under /api/v1/remediation (see main.py):
  POST   /remediation/generate        Generate a remediation for a finding
  GET    /remediation/{project_id}    List remediations for a project
  GET    /remediation/report/{id}     Get a single full report
  PUT    /remediation/{id}/status     Update status (Open/In Progress/Fixed)
  POST   /remediation/{id}/fix        Mark as fixed + record re-scan verification
"""
from fastapi import APIRouter, Depends, HTTPException

from app.dependencies.auth import get_current_user
from app.schemas.remediation_schema import (
    RemediationGenerateRequest,
    RemediationGenerateResponse,
    RemediationStatusUpdate,
    RemediationSummary,
    RemediationReport,
    RemediationStatusResponse,
)
from app.services import remediation_service as svc

router = APIRouter()


@router.post("/generate", response_model=RemediationGenerateResponse)
async def generate_remediation(payload: RemediationGenerateRequest,
                               user=Depends(get_current_user)):
    """Generate an AI remediation (spec Step 8)."""
    user_id = str(user["_id"])

    finding = (payload.finding or "").strip()
    if not finding:
        raise HTTPException(status_code=400, detail="A 'finding' is required.")

    report_id = await svc.generate_fix(
        user_id=user_id,
        project_id=payload.project_id or "",
        finding=finding,
        severity=payload.severity,
        technology=payload.technology,
        code=payload.code,
        file=payload.file,
        line=payload.line,
        source=payload.source or "manual",
        context=payload.context,
        vulnerability_id=payload.finding_id,
    )
    return RemediationGenerateResponse(message="Remediation generated", report_id=report_id)


@router.get("/{project_id}", response_model=list[RemediationSummary])
async def list_remediations(project_id: str, user=Depends(get_current_user)):
    """List recommendations for a project (spec Step 8)."""
    user_id = str(user["_id"])
    return await svc.list_remediations(user_id, project_id)


@router.get("/report/{report_id}", response_model=RemediationReport)
async def get_remediation(report_id: str, user=Depends(get_current_user)):
    """Get a single full fix (spec Step 8)."""
    user_id = str(user["_id"])
    doc = await svc.get_remediation(report_id, user_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Remediation report not found")
    return svc.to_report(doc)


@router.put("/{report_id}/status", response_model=RemediationStatusResponse)
async def update_remediation_status(report_id: str, payload: RemediationStatusUpdate,
                                    user=Depends(get_current_user)):
    """Update remediation status (spec Step 8)."""
    user_id = str(user["_id"])
    allowed = {"Open", "In Progress", "Fixed"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status.")
    ok = await svc.update_status(report_id, user_id, payload.status)
    if not ok:
        raise HTTPException(status_code=404, detail="Remediation report not found")
    return RemediationStatusResponse(message="Status updated", status=payload.status,
                                     report_id=report_id)


@router.post("/{report_id}/fix", response_model=RemediationStatusResponse)
async def mark_remediation_fixed(report_id: str, user=Depends(get_current_user)):
    """Mark as fixed + verify via re-scan (spec Step 14)."""
    user_id = str(user["_id"])
    ok = await svc.mark_fixed(report_id, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Remediation report not found")
    return RemediationStatusResponse(message="Marked as fixed", status="Fixed",
                                     report_id=report_id)
