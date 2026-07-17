from fastapi import HTTPException
from app.database.db import database
from app.utils.password import hash_password, verify_password
from app.schemas.auth_schema import RegisterRequest, LoginRequest
from app.core.security import create_access_token, create_refresh_token
from app.services.email_service import EmailService
from datetime import datetime
import secrets


async def register_user(request: RegisterRequest):
    # Check if email already exists
    existing_user = await database.users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed_password = hash_password(request.password)

    # Generate verification token
    verification_token = secrets.token_urlsafe(32)

    # Build user document
    user_document = {
        "full_name": request.full_name,
        "email": request.email,
        "hashed_password": hashed_password,
        "role": "student",
        "is_verified": False,
        "is_active": True,
        "profile_image": None,
        "verification_token": verification_token,
        "reset_token": None,
        "refresh_token": None,
        "last_login": None,
        "last_activity": None,
        "login_history": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    # Insert into MongoDB
    result = await database.users.insert_one(user_document)

    # Send verification email
    await EmailService.send_verification_email(
        email=request.email,
        verification_token=verification_token,
        user_name=request.full_name
    )

    # Return inserted ID
    return str(result.inserted_id)


async def login_user(request: LoginRequest):
    # Find user by email
    user = await database.users.find_one({"email": request.email})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Generate access token
    access_token = create_access_token(
        data={
            "sub": user["email"],
            "user_id": str(user["_id"]),
            "role": user["role"]
        }
    )
    
    # Generate refresh token if remember_me is true
    refresh_token = None
    if request.remember_me:
        refresh_token = create_refresh_token(
            data={
                "sub": user["email"],
                "user_id": str(user["_id"])
            }
        )
        # Save refresh token to database
        await database.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"refresh_token": refresh_token}}
        )
    
    # Update last login and add to login history
    login_entry = {
        "login_time": datetime.utcnow(),
        "ip": "127.0.0.1",  # In production, get from request
        "browser": "Unknown",  # In production, get from user agent
        "device": "Unknown"  # In production, get from user agent
    }
    
    await database.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "last_login": datetime.utcnow(),
                "last_activity": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            "$push": {"login_history": login_entry}
        }
    )
    
    # Return token and user info
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "is_verified": user.get("is_verified", False)
        }
    }


async def send_verification_email(email: str):
    user = await database.users.find_one({"email": email})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("is_verified", False):
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Generate new verification token
    verification_token = secrets.token_urlsafe(32)
    
    # Update user with new token
    await database.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"verification_token": verification_token, "updated_at": datetime.utcnow()}}
    )
    
    # Send email
    await EmailService.send_verification_email(
        email=email,
        verification_token=verification_token,
        user_name=user["full_name"]
    )
    
    return {"success": True, "message": "Verification email sent"}


async def verify_email(token: str):
    user = await database.users.find_one({"verification_token": token})
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Mark email as verified
    await database.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "is_verified": True,
                "verification_token": None,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"success": True, "message": "Email verified successfully"}


async def forgot_password(email: str):
    user = await database.users.find_one({"email": email})
    
    if not user:
        # Don't reveal if email exists for security
        return {"success": True, "message": "If email exists, reset link sent"}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    
    # Update user with reset token
    await database.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"reset_token": reset_token, "updated_at": datetime.utcnow()}}
    )
    
    # Send email
    await EmailService.send_password_reset_email(
        email=email,
        reset_token=reset_token,
        user_name=user["full_name"]
    )
    
    return {"success": True, "message": "If email exists, reset link sent"}


async def reset_password(token: str, new_password: str):
    user = await database.users.find_one({"reset_token": token})
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Hash new password
    hashed_password = hash_password(new_password)
    
    # Update password and clear reset token
    await database.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "hashed_password": hashed_password,
                "reset_token": None,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"success": True, "message": "Password reset successfully"}


async def change_password(user_id: str, current_password: str, new_password: str):
    user = await database.users.find_one({"_id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(current_password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Hash new password
    hashed_password = hash_password(new_password)
    
    # Update password
    await database.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "hashed_password": hashed_password,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"success": True, "message": "Password changed successfully"}


async def refresh_token(refresh_token: str):
    try:
        from app.core.security import verify_access_token
        payload = verify_access_token(refresh_token)
        
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        # Find user
        user = await database.users.find_one({"_id": payload["user_id"]})
        
        if not user or user.get("refresh_token") != refresh_token:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        # Generate new access token
        access_token = create_access_token(
            data={
                "sub": user["email"],
                "user_id": str(user["_id"]),
                "role": user["role"]
            }
        )
        
        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer"
        }
        
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


async def logout_user(user_id: str):
    # Clear refresh token
    await database.users.update_one(
        {"_id": user_id},
        {"$set": {"refresh_token": None, "updated_at": datetime.utcnow()}}
    )
    
    return {"success": True, "message": "Logged out successfully"}


async def logout_all_devices(user_id: str):
    # Clear refresh token
    await database.users.update_one(
        {"_id": user_id},
        {"$set": {"refresh_token": None, "updated_at": datetime.utcnow()}}
    )
    
    return {"success": True, "message": "Logged out from all devices successfully"}


async def update_user_activity(user_id: str):
    # Update last activity
    await database.users.update_one(
        {"_id": user_id},
        {"$set": {"last_activity": datetime.utcnow()}}
    )

