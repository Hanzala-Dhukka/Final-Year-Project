from fastapi import APIRouter, Depends, UploadFile, File
from app.schemas.profile_schema import ProfileResponse, UpdateProfileRequest
from app.services.user_service import get_profile, update_profile, upload_avatar, delete_avatar
from app.dependencies.auth import get_current_user

router = APIRouter()


@router.get("/users/profile", response_model=ProfileResponse)
async def get_user_profile(current_user = Depends(get_current_user)):
    """
    Get current user's profile.
    """
    return await get_profile(str(current_user["_id"]))


@router.put("/users/profile", response_model=ProfileResponse)
async def update_user_profile(
    profile_data: UpdateProfileRequest,
    current_user = Depends(get_current_user)
):
    """
    Update current user's profile.
    """
    return await update_profile(str(current_user["_id"]), profile_data.dict(exclude_unset=True))


@router.post("/users/avatar")
async def upload_user_avatar(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Upload user avatar image.
    """
    return await upload_avatar(str(current_user["_id"]), file)


@router.delete("/users/avatar")
async def delete_user_avatar(current_user = Depends(get_current_user)):
    """
    Delete user avatar.
    """
    return await delete_avatar(str(current_user["_id"]))
