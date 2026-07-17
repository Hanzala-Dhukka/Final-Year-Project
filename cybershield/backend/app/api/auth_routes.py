from fastapi import APIRouter, Depends
from app.schemas.auth_schema import (
    RegisterRequest, RegisterResponse, LoginRequest, LoginResponse,
    ForgotPasswordRequest, ForgotPasswordResponse, ResetPasswordRequest, ResetPasswordResponse,
    ChangePasswordRequest, ChangePasswordResponse, RefreshTokenRequest, RefreshTokenResponse,
    VerifyEmailRequest, VerifyEmailResponse, SendVerificationRequest, SendVerificationResponse,
    LogoutResponse, LogoutAllResponse
)
from app.services.auth_service import (
    register_user, login_user, send_verification_email, verify_email,
    forgot_password, reset_password, change_password, refresh_token,
    logout_user, logout_all_devices
)
from app.dependencies.auth import get_current_user

router = APIRouter()

@router.post("/auth/register", response_model=RegisterResponse)
async def register(request: RegisterRequest):
    user_id = await register_user(request)
    
    return RegisterResponse(
        success=True,
        message="User registered successfully. Please check your email to verify your account.",
        user_id=user_id
    )

@router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    result = await login_user(request)
    
    return LoginResponse(
        success=True,
        access_token=result["access_token"],
        refresh_token=result["refresh_token"] or "",
        token_type=result["token_type"],
        user=result["user"]
    )

@router.get("/auth/me")
async def get_current_user_info(current_user = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "full_name": current_user["full_name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "is_verified": current_user.get("is_verified", False),
        "last_login": current_user.get("last_login"),
        "created_at": current_user.get("created_at")
    }

@router.post("/auth/send-verification", response_model=SendVerificationResponse)
async def send_verification(request: SendVerificationRequest):
    result = await send_verification_email(request.email)
    return SendVerificationResponse(
        success=result["success"],
        message=result["message"]
    )

@router.get("/auth/verify-email", response_model=VerifyEmailResponse)
async def verify_email_endpoint(token: str):
    result = await verify_email(token)
    return VerifyEmailResponse(
        success=result["success"],
        message=result["message"]
    )

@router.post("/auth/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password_endpoint(request: ForgotPasswordRequest):
    result = await forgot_password(request.email)
    return ForgotPasswordResponse(
        success=result["success"],
        message=result["message"]
    )

@router.post("/auth/reset-password", response_model=ResetPasswordResponse)
async def reset_password_endpoint(request: ResetPasswordRequest):
    result = await reset_password(request.token, request.password)
    return ResetPasswordResponse(
        success=result["success"],
        message=result["message"]
    )

@router.post("/auth/change-password", response_model=ChangePasswordResponse)
async def change_password_endpoint(request: ChangePasswordRequest, current_user = Depends(get_current_user)):
    result = await change_password(str(current_user["_id"]), request.current_password, request.new_password)
    return ChangePasswordResponse(
        success=result["success"],
        message=result["message"]
    )

@router.post("/auth/refresh-token", response_model=RefreshTokenResponse)
async def refresh_token_endpoint(request: RefreshTokenRequest):
    result = await refresh_token(request.refresh_token)
    return RefreshTokenResponse(
        success=result["success"],
        access_token=result["access_token"],
        token_type=result["token_type"]
    )

@router.post("/auth/logout", response_model=LogoutResponse)
async def logout_endpoint(current_user = Depends(get_current_user)):
    result = await logout_user(str(current_user["_id"]))
    return LogoutResponse(
        success=result["success"],
        message=result["message"]
    )

@router.post("/auth/logout-all", response_model=LogoutAllResponse)
async def logout_all_endpoint(current_user = Depends(get_current_user)):
    result = await logout_all_devices(str(current_user["_id"]))
    return LogoutAllResponse(
        success=result["success"],
        message=result["message"]
    )
