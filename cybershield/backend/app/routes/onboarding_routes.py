"""
Onboarding routes — expose the first-time user setup API.

Mounted at /api/v1/onboarding (see app/main.py). All endpoints require a
valid JWT via get_current_user.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List

from app.utils.security import get_current_user
from app.services.onboarding_service import (
    get_onboarding_status,
    complete_onboarding,
    skip_onboarding,
)

router = APIRouter()


class OnboardingComplete(BaseModel):
    """Payload submitted when the onboarding wizard finishes."""
    name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    skill_level: str = Field(default="", max_length=50)
    learning_goals: List[str] = Field(default_factory=list)


@router.get("/status")
async def onboarding_status(current_user: dict = Depends(get_current_user)):
    """
    Get the current onboarding status for the authenticated user.
    """
    try:
        return await get_onboarding_status(current_user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load onboarding status: {str(e)}"
        )


@router.post("/complete")
async def complete(
    data: OnboardingComplete,
    current_user: dict = Depends(get_current_user)
):
    """
    Save the collected onboarding preferences and finish onboarding.
    """
    try:
        return await complete_onboarding(current_user, data.model_dump())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete onboarding: {str(e)}"
        )


@router.post("/skip")
async def skip(current_user: dict = Depends(get_current_user)):
    """
    Skip the onboarding flow (user opts out). Sends them to the dashboard.
    """
    try:
        return await skip_onboarding(current_user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to skip onboarding: {str(e)}"
        )
