from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from datetime import datetime
from app.database.db import database
from app.models.user_model import UserUpdate

router = APIRouter()
users_collection = database["users"]


@router.get("/profile/{user_id}")
async def get_user_profile(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )

    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "created_at": user.get("created_at")
    }


@router.put("/profile/{user_id}")
async def update_user_profile(user_id: str, profile_data: UserUpdate):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )

    # Filter out None values to perform a partial update
    update_dict = {k: v for k, v in profile_data.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No update data provided"
        )

    # If updating email, check for duplicate emails
    if "email" in update_dict:
        existing_user = await users_collection.find_one({
            "email": update_dict["email"],
            "_id": {"$ne": ObjectId(user_id)}
        })
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use by another user"
            )

    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_dict}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    updated_user = await users_collection.find_one({"_id": ObjectId(user_id)})

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": str(updated_user["_id"]),
            "name": updated_user.get("name"),
            "email": updated_user.get("email"),
            "created_at": updated_user.get("created_at")
        }
    }


@router.delete("/{user_id}")
async def delete_user(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )

    result = await users_collection.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {"message": "User deleted successfully"}
