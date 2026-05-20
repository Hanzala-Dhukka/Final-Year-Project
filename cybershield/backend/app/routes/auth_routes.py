from fastapi import APIRouter, HTTPException, Depends
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


from app.models.user_model import UserLogin
from app.utils.security import (
    verify_password,
    create_access_token
)


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
            "user_id": str(existing_user["_id"]),
            "email": existing_user["email"]
        }
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer"
    }


from app.utils.dependencies import verify_token


@router.get("/profile")
async def get_profile(
    user_data: dict = Depends(verify_token)
):

    return {
        "message": "Protected route accessed",
        "user": user_data
    }


