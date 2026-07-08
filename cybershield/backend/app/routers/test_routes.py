"""
Test routes for MongoDB CRUD operations.
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from app.core.database import get_collection
from typing import Optional

router = APIRouter()


@router.get("/db-test")
async def database_test():
    """Test database connection and list collections."""
    try:
        database = get_collection("").database
        collections = await database.list_collection_names()
        
        return {
            "database": "connected",
            "database_name": database.name,
            "collections": collections
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )


@router.post("/test/create")
async def create_test_user(name: str, email: str):
    """Create a test user in MongoDB."""
    try:
        users_collection = get_collection("users")
        
        user = {
            "name": name,
            "email": email,
            "created_at": datetime.now(timezone.utc)
        }
        
        result = await users_collection.insert_one(user)
        
        return {
            "message": "User created successfully",
            "user_id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating user: {str(e)}"
        )


@router.get("/test/users")
async def get_test_users():
    """Get all test users from MongoDB."""
    try:
        users_collection = get_collection("users")
        
        users = []
        cursor = users_collection.find({})
        
        async for user in cursor:
            user["_id"] = str(user["_id"])
            users.append(user)
        
        return users
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching users: {str(e)}"
        )


@router.get("/test/user/{user_id}")
async def get_test_user(user_id: str):
    """Get a specific user by ID."""
    try:
        from bson import ObjectId
        users_collection = get_collection("users")
        
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        user["_id"] = str(user["_id"])
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching user: {str(e)}"
        )


@router.put("/test/user/{user_id}")
async def update_test_user(user_id: str, name: Optional[str] = None, email: Optional[str] = None):
    """Update a test user."""
    try:
        from bson import ObjectId
        users_collection = get_collection("users")
        
        # Build update document
        update_data = {}
        if name:
            update_data["name"] = name
        if email:
            update_data["email"] = email
        
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No update data provided"
            )
        
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        return {
            "message": "User updated successfully",
            "modified_count": result.modified_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating user: {str(e)}"
        )


@router.delete("/test/user/{user_id}")
async def delete_test_user(user_id: str):
    """Delete a test user."""
    try:
        from bson import ObjectId
        users_collection = get_collection("users")
        
        result = await users_collection.delete_one({"_id": ObjectId(user_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        return {
            "message": "User deleted successfully",
            "deleted_count": result.deleted_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting user: {str(e)}"
        )