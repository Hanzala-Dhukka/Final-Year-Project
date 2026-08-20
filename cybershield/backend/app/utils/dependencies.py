"""
Utility dependencies for token verification.
"""
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings
from app.services.error_log_service import fire_and_forget_log

security = HTTPBearer()


def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Verify JWT token and return payload.
    
    Args:
        credentials: HTTP Bearer credentials
        
    Returns:
        Token payload
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        return payload

    except JWTError:
        fire_and_forget_log()
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )