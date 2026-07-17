from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)

class RegisterResponse(BaseModel):
    success: bool
    message: str
    user_id: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

class LoginResponse(BaseModel):
    success: bool
    access_token: str
    refresh_token: str
    token_type: str
    user: dict

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordResponse(BaseModel):
    success: bool
    message: str

class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=8)

class ResetPasswordResponse(BaseModel):
    success: bool
    message: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)

class ChangePasswordResponse(BaseModel):
    success: bool
    message: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class RefreshTokenResponse(BaseModel):
    success: bool
    access_token: str
    token_type: str

class VerifyEmailRequest(BaseModel):
    token: str

class VerifyEmailResponse(BaseModel):
    success: bool
    message: str

class SendVerificationRequest(BaseModel):
    email: EmailStr

class SendVerificationResponse(BaseModel):
    success: bool
    message: str

class LogoutResponse(BaseModel):
    success: bool
    message: str

class LogoutAllResponse(BaseModel):
    success: bool
    message: str
