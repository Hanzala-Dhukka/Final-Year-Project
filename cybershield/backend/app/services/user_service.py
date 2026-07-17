from fastapi import HTTPException, UploadFile
from app.database.db import database
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
import os
import uuid
from pathlib import Path

# Configuration
UPLOAD_DIR = Path("uploads/profile")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2 MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _to_object_id(user_id: str):
    """Convert a string user id to a MongoDB ObjectId (raises 404 if invalid)."""
    try:
        return ObjectId(user_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="User not found")


async def get_profile(user_id: str):
    """
    Get user profile by user ID.
    
    Args:
        user_id: User ID from MongoDB
        
    Returns:
        User profile data
    """
    user = await database.users.find_one({"_id": _to_object_id(user_id)})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "full_name": user.get("full_name", ""),
        "email": user.get("email", ""),
        "phone": user.get("phone"),
        "bio": user.get("bio"),
        "college": user.get("college"),
        "course": user.get("course"),
        "year": user.get("year"),
        "github": user.get("github"),
        "linkedin": user.get("linkedin"),
        "website": user.get("website"),
        "profile_image": user.get("profile_image"),
        "role": user.get("role", "student")
    }


async def update_profile(user_id: str, profile_data: dict):
    """
    Update user profile.
    
    Args:
        user_id: User ID from MongoDB
        profile_data: Dictionary containing profile fields to update
        
    Returns:
        Updated profile data
    """
    # Build update document with only provided fields
    update_fields = {}
    
    if "full_name" in profile_data:
        update_fields["full_name"] = profile_data["full_name"]
    if "phone" in profile_data:
        update_fields["phone"] = profile_data["phone"]
    if "bio" in profile_data:
        update_fields["bio"] = profile_data["bio"]
    if "college" in profile_data:
        update_fields["college"] = profile_data["college"]
    if "course" in profile_data:
        update_fields["course"] = profile_data["course"]
    if "year" in profile_data:
        update_fields["year"] = profile_data["year"]
    if "github" in profile_data:
        update_fields["github"] = profile_data["github"]
    if "linkedin" in profile_data:
        update_fields["linkedin"] = profile_data["linkedin"]
    if "website" in profile_data:
        update_fields["website"] = profile_data["website"]
    
    update_fields["updated_at"] = datetime.utcnow()
    
    # Update user in database
    result = await database.users.update_one(
        {"_id": _to_object_id(user_id)},
        {"$set": update_fields}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return updated profile
    return await get_profile(user_id)


async def upload_avatar(user_id: str, file: UploadFile):
    """
    Upload user avatar image.
    
    Args:
        user_id: User ID from MongoDB
        file: Uploaded file
        
    Returns:
        Updated profile with new avatar path
    """
    # Validate file size
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 2 MB limit")
    
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Update user's profile_image in database
    profile_image_path = f"/uploads/profile/{unique_filename}"
    await database.users.update_one(
        {"_id": user_id},
        {"$set": {"profile_image": profile_image_path, "updated_at": datetime.utcnow()}}
    )
    
    return {
        "message": "Avatar uploaded successfully",
        "profile_image": profile_image_path
    }


async def delete_avatar(user_id: str):
    """
    Delete user avatar.
    
    Args:
        user_id: User ID from MongoDB
        
    Returns:
        Success message
    """
    user = await database.users.find_one({"_id": _to_object_id(user_id)})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete file if exists
    current_avatar = user.get("profile_image")
    if current_avatar:
        file_path = Path(current_avatar.lstrip("/"))
        if file_path.exists():
            file_path.unlink()
    
    # Remove profile_image from database
    await database.users.update_one(
        {"_id": user_id},
        {"$set": {"profile_image": None, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Avatar deleted successfully"}
