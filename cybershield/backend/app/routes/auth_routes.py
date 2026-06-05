from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime

from app.database.db import database
from app.models.user_model import UserCreate
from app.utils.security import hash_password
from app.models.user_model import UserLogin
from app.utils.security import (
    verify_password,
    create_access_token
)
from app.utils.dependencies import verify_token
from app.dependencies.auth import get_current_user

router = APIRouter()
users_collection = database["users"]


@router.get("/me")
async def get_me(
    current_user=Depends(
        get_current_user
    )
):
    current_user["_id"] = str(
        current_user["_id"]
    )

    current_user.pop(
        "password",
        None
    )

    return current_user

@router.post("/register")
async def register_user(user_in: UserCreate):

    existing_user = await users_collection.find_one({
        "email": user_in.email
    })

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(user_in.password)

    user = {
        "username": user_in.username,
        "email": user_in.email,
        "password": hashed_password,
        "role": user_in.role,
        "created_at": datetime.utcnow()
    }

    result = await users_collection.insert_one(user)

    return {
        "message": "User registered successfully",
        "user_id": str(result.inserted_id)
    }

@router.post("/login")
async def login_user(user: UserLogin):

    existing_user = await users_collection.find_one({
        "email": user.email
    })

    if not existing_user:
        raise HTTPException(
            status_code=400,
            detail="Invalid email or password"
        )

    valid_password = verify_password(
        user.password,
        existing_user["password"]
    )

    if not valid_password:
        raise HTTPException(
            status_code=400,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": existing_user["email"],
            "user_id": str(existing_user["_id"]),
            "role": existing_user.get("role", "user")
        }
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/profile")
async def get_profile(
    user_data: dict = Depends(verify_token)
):

    return {
        "message": "Protected route accessed",
        "user": user_data
    }