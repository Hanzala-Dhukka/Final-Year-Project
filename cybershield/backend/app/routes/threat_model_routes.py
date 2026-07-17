
from fastapi import APIRouter, HTTPException
from app.models.threat_model import ThreatModelCreate
from app.services.threat_model_service import create_threat_model

router = APIRouter()


@router.post("/create")
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

        # Return the full result (threats, recommendations, fix plan, report, etc.)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create threat model: {str(e)}"
        )
