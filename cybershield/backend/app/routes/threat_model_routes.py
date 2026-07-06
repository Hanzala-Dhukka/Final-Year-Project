
from fastapi import APIRouter, HTTPException
from app.models.threat_model import ThreatModelCreate, ThreatModelResponse, Threat, Recommendation, FixPlanItem, SecurityReport
from app.services.threat_model_service import create_threat_model
from typing import List

router = APIRouter()


@router.post("/create", response_model=ThreatModelResponse)
async def create_threat_model_endpoint(data: ThreatModelCreate):
    try:
        # Validate required fields
        if not data.project_name.strip():
            raise HTTPException(status_code=400, detail="Project name is required and cannot be empty")
        if not data.frontend.strip():
            raise HTTPException(status_code=400, detail="Frontend is required")
        if not data.backend.strip():
            raise HTTPException(status_code=400, detail="Backend is required")
        if not data.database.strip():
            raise HTTPException(status_code=400, detail="Database is required")
        if not data.authentication.strip():
            raise HTTPException(status_code=400, detail="Authentication method is required")

        # Create the threat model
        result = create_threat_model(data)
        
        # Return the new response format with recommendations
        return ThreatModelResponse(
            project=result["project"],
            threats_found=result["threats_found"],
            risk_level=result["risk_level"],
            overall_risk=result["overall_risk"],
            average_score=result["average_score"],
            risk_summary=result["risk_summary"],
            top_risks=result["top_risks"],
            threats=[Threat(**t) for t in result["threats"]],
            recommendations=[Recommendation(**r) for r in result["recommendations"]],
            fix_plan=[FixPlanItem(**f) for f in result["fix_plan"]],
            security_report=SecurityReport(**result["security_report"])
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create threat model: {str(e)}"
        )

