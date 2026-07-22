"""
Authentication routes for login, register, and password reset.
"""
from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import Optional
import secrets
from app.models.user_model import UserCreate, UserLogin, UserResponse, TokenResponse
from app.models.reset_token_model import PasswordResetRequest, PasswordResetConfirm, PasswordResetResponse
from app.repositories.user_repository import user_repository
from app.repositories.reset_token_repository import reset_token_repository
from app.services.password_service import password_service
from app.services.email_service import email_service
from app.services.token_service import token_service
from app.services.refresh_service import refresh_service
from app.services.session_service import session_service
from app.services.auth_service import logout_all_devices
from app.utils.security import create_access_token, create_refresh_token, get_current_user
from app.core.config import settings

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user.
    
    Args:
        user_data: User registration data
        
    Returns:
        Created user data
    """
    try:
        # Check if user already exists
        existing_user = await user_repository.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        password_hash = password_service.hash_password(user_data.password)

        # Generate verification token + 24h expiry
        verification_token = secrets.token_urlsafe(32)
        token_expiry = datetime.now(timezone.utc) + timedelta(hours=24)

        # Create user data
        user_dict = {
            "name": user_data.name,
            "email": user_data.email,
            "password_hash": password_hash,
            "role": "student",
            "is_verified": False,
            "verification_token": verification_token,
            "token_expiry": token_expiry,
            "account_status": "active",
            # Onboarding defaults — new users start the onboarding flow
            "first_login": True,
            "profile_completed": False,
            "skill_level": "",
            "learning_goals": [],
            "dashboard_tour_completed": False,
            "avatar": "",
            "bio": "",
            "created_at": datetime.now(timezone.utc),
            "last_login": None
        }

        # Create user
        user_id = await user_repository.create_user(user_dict)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )

        # Get created user
        user = await user_repository.get_user_by_id(user_id)

        # Send verification email (required for activation)
        try:
            await email_service.send_verification_email(
                user_data.email, verification_token, user_data.name
            )
        except Exception as e:
            print(f"Failed to send verification email: {e}")

        # Send welcome email (optional)
        try:
            await email_service.send_welcome_email(user_data.email, user_data.name)
        except Exception as e:
            print(f"Failed to send welcome email: {e}")
        
        return UserResponse(
            id=user_id,
            name=user["name"],
            email=user["email"],
            role=user.get("role", "student"),
            is_verified=user.get("is_verified", False),
            first_login=user.get("first_login", True),
            profile_completed=user.get("profile_completed", False),
            skill_level=user.get("skill_level", ""),
            learning_goals=user.get("learning_goals", []),
            dashboard_tour_completed=user.get("dashboard_tour_completed", False),
            avatar=user.get("avatar"),
            bio=user.get("bio"),
            created_at=user["created_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, request: Request):
    """
    Login user and return access and refresh tokens.
    
    Args:
        credentials: Login credentials
        request: FastAPI request object
        
    Returns:
        Access and refresh tokens
    """
    try:
        print(f"LOGIN ATTEMPT: Email={credentials.email}")
        # Get user by email
        user = await user_repository.get_user_by_email(credentials.email)
        if not user:
            print(f"LOGIN FAILED: User not found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        print(f"LOGIN: User found, verifying password...")
        # Verify password
        if not password_service.verify_password(credentials.password, user["password_hash"]):
            print(f"LOGIN FAILED: Invalid password")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if account is active
        if user.get("account_status") != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled"
            )
        
        # Block login until the email address is verified
        if not user.get("is_verified", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email before logging in"
            )
        
        print(f"LOGIN: Password verified, creating tokens...")
        # Create tokens
        user_id = str(user["_id"])
        access_token = create_access_token(data={"user_id": user_id, "role": user.get("role", "student")})
        refresh_token = create_refresh_token(data={"user_id": user_id})
        
        # Store refresh token in database (with error handling)
        try:
            await refresh_service.store_refresh_token(
                user_id=user_id,
                token=refresh_token,
                device=credentials.device or "Unknown Device",
                ip_address=request.client.host if request.client else "Unknown"
            )
        except Exception as e:
            print(f"WARNING: Failed to store refresh token: {e}")
        
        # Create session (with error handling)
        try:
            session_service.create_session(
                user_id=user_id,
                device=credentials.device or "Unknown Device",
                ip_address=request.client.host if request.client else "Unknown"
            )
        except Exception as e:
            print(f"WARNING: Failed to create session: {e}")
        
        # Update last login (with error handling)
        try:
            await user_repository.update_user(user_id, {
                "last_login": datetime.now(timezone.utc)
            })
        except Exception as e:
            print(f"WARNING: Failed to update last login: {e}")
        
        print(f"LOGIN SUCCESS: Token created for user {user_id}")
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            first_login=user.get("first_login", False)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"LOGIN ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token.
    
    Args:
        refresh_token: Valid refresh token
        
    Returns:
        New access token
    """
    refresh_token = request.refresh_token
    try:
        # Verify refresh token
        token_data = await refresh_service.verify_refresh_token(refresh_token)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        # Get user
        user_id = token_data.get("user_id")
        user = await user_repository.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if account is active
        if user.get("account_status") != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled"
            )
        
        # Create new access token
        new_access_token = create_access_token(data={
            "user_id": user_id,
            "role": user.get("role", "student")
        })
        
        # Update refresh token last used
        await refresh_service.update_token_last_used(refresh_token)
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout user by revoking all refresh tokens and closing sessions.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Success message
    """
    try:
        user_id = str(current_user["_id"])
        
        # Revoke all refresh tokens
        await refresh_service.revoke_all_user_tokens(user_id)
        
        # Close all sessions
        session_service.close_all_user_sessions(user_id)
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )


@router.post("/logout-all")
async def logout_all(current_user: dict = Depends(get_current_user)):
    """
    Logout from all devices by revoking the refresh token.
    """
    try:
        user_id = str(current_user["_id"])
        await logout_all_devices(user_id)
        return {"message": "Logged out from all devices successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )


@router.get("/verify-email")
async def verify_email_endpoint(token: str):
    """
    Verify a user's email using the verification token sent by email.
    """
    try:
        user = await user_repository.get_user_by_verification_token(token)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token"
            )

        # Token expiry handling
        token_expiry = user.get("token_expiry")
        if token_expiry and token_expiry < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification token has expired. Please request a new one."
            )

        # Already verified — treat as success to avoid confusing the user
        if user.get("is_verified", False):
            return {"success": True, "message": "Email already verified"}

        # Mark email as verified and clear the token
        update_success = await user_repository.update_user(str(user["_id"]), {
            "is_verified": True,
            "verification_token": None,
            "token_expiry": None,
            "updated_at": datetime.now(timezone.utc)
        })
        if not update_success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to verify email"
            )

        return {"success": True, "message": "Email verified successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email verification failed: {str(e)}"
        )


class ResendVerificationRequest(BaseModel):
    email: str


@router.post("/resend-verification", response_model=PasswordResetResponse)
async def resend_verification(request: ResendVerificationRequest):
    """
    Resend a verification email with a fresh token + expiry.
    """
    try:
        user = await user_repository.get_user_by_email(request.email)

        # Always return success to avoid user enumeration
        if not user:
            return PasswordResetResponse(
                message="If an account exists, a verification email has been sent"
            )

        # No need to resend if already verified
        if user.get("is_verified", False):
            return PasswordResetResponse(
                message="This email is already verified. You can log in."
            )

        # Generate a new verification token + 24h expiry
        verification_token = secrets.token_urlsafe(32)
        token_expiry = datetime.now(timezone.utc) + timedelta(hours=24)

        update_success = await user_repository.update_user(str(user["_id"]), {
            "verification_token": verification_token,
            "token_expiry": token_expiry,
            "updated_at": datetime.now(timezone.utc)
        })
        if not update_success:
            return PasswordResetResponse(
                message="If an account exists, a verification email has been sent"
            )

        try:
            await email_service.send_verification_email(
                email=user["email"],
                verification_token=verification_token,
                user_name=user["name"]
            )
        except Exception as e:
            print(f"Failed to send verification email: {e}")

        return PasswordResetResponse(
            message="If an account exists, a verification email has been sent"
        )
    except Exception as e:
        # Still return success to avoid user enumeration
        return PasswordResetResponse(
            message="If an account exists, a verification email has been sent"
        )


@router.post("/forgot-password", response_model=PasswordResetResponse)
async def forgot_password(request: PasswordResetRequest):
    """
    Request password reset email.
    
    Args:
        request: Password reset request with email
        
    Returns:
        Success message (always, to prevent user enumeration)
    """
    try:
        # Find user by email
        user = await user_repository.get_user_by_email(request.email)
        
        # Always return success to prevent user enumeration
        if not user:
            return PasswordResetResponse(message="If an account exists, a reset link has been sent")
        
        # Generate reset token
        reset_token = await token_service.create_password_reset_token(
            user_id=str(user["_id"]),
            expires_in_minutes=15
        )
        
        if reset_token:
            # Send reset email
            try:
                await email_service.send_password_reset_email(
                    email=user["email"],
                    reset_token=reset_token,
                    user_name=user["name"]
                )
            except Exception as e:
                print(f"Failed to send password reset email: {e}")
        
        return PasswordResetResponse(message="If an account exists, a reset link has been sent")
        
    except Exception as e:
        # Still return success to prevent user enumeration
        return PasswordResetResponse(message="If an account exists, a reset link has been sent")


@router.post("/reset-password", response_model=PasswordResetResponse)
async def reset_password(request: PasswordResetConfirm):
    """
    Reset password using reset token.
    
    Args:
        request: Reset token and new password
        
    Returns:
        Success message
    """
    try:
        # Verify reset token
        token_data = await token_service.verify_reset_token(request.token)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Validate new password
        is_valid, error_message = password_service.validate_password_strength(request.new_password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        # Check if password is commonly used
        if password_service.is_password_common(request.new_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is too common. Please choose a stronger password"
            )
        
        # Hash new password
        new_password_hash = password_service.hash_password(request.new_password)
        
        # Update user password
        user_id = token_data["user_id"]
        update_success = await user_repository.update_user(user_id, {
            "password_hash": new_password_hash
        })
        
        if not update_success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update password"
            )
        
        # Mark token as used
        await token_service.use_reset_token(request.token)
        
        # Invalidate all user sessions (security measure)
        session_service.close_all_user_sessions(user_id)
        await refresh_service.revoke_all_user_tokens(user_id)
        
        return PasswordResetResponse(message="Password updated successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset failed: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get current user information.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User information
    """
    return UserResponse(
        id=str(current_user["_id"]),
        name=current_user["name"],
        email=current_user["email"],
        role=current_user.get("role", "student"),
        is_verified=current_user.get("is_verified", False),
        first_login=current_user.get("first_login", False),
        profile_completed=current_user.get("profile_completed", False),
        skill_level=current_user.get("skill_level", ""),
        learning_goals=current_user.get("learning_goals", []),
        dashboard_tour_completed=current_user.get("dashboard_tour_completed", False),
        avatar=current_user.get("avatar"),
        bio=current_user.get("bio"),
        created_at=current_user["created_at"]
    )