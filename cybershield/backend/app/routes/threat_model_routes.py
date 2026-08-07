
from fastapi import APIRouter, HTTPException, Depends
from app.models.threat_model import ThreatModelCreate
from app.services.threat_model_service import create_threat_model
from app.dependencies.auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/create")
async def create_threat_model_endpoint(
    data: ThreatModelCreate,
    current_user: dict = Depends(get_current_user),
):
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

        user_id = str(current_user.get("_id", ""))

        # Create the threat model (async — calls AI)
        result = await create_threat_model(data, user_id=user_id)

        # Return the full result (threats, recommendations, fix plan, report, etc.)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to create threat model")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create threat model: {str(e)}"
        )
