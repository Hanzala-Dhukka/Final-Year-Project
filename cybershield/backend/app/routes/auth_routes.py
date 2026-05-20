from fastapi import APIRouter, HTTPException
from datetime import datetime

from app.database.db import database
from app.models.user_model import UserRegister
from app.utils.security import hash_password

router = APIRouter()

users_collection = database["users"]


@router.post("/register")
async def register_user(user: UserRegister):

    existing_user = await users_collection.find_one({
        "email": user.email
    })

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(user.password)

    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }

    result = await users_collection.insert_one(new_user)

    return {
        "message": "User registered successfully",
        "user_id": str(result.inserted_id)
    }
