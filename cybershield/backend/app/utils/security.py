"""
Security utilities for JWT token generation and validation.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config.settings import settings
from app.repositories.user_repository import user_repository

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Get the current authenticated user from the JWT bearer token.

    Args:
        credentials: HTTP Bearer credentials extracted from the Authorization header

    Returns:
        The user document from MongoDB

    Raises:
        HTTPException: If the token is invalid or the user cannot be found
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("user_id")
        if not user_id:
            print(f"ERROR: No user_id in token payload")
            raise HTTPException(status_code=401, detail="Invalid token payload")

        user = await user_repository.get_user_by_id(user_id)
        if not user:
            print(f"ERROR: User not found for user_id: {user_id}")
            raise HTTPException(status_code=401, detail="User not found")

        return user
    except JWTError as e:
        print(f"ERROR: JWT decode failed: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
    except Exception as e:
        print(f"ERROR: Unexpected error in get_current_user: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Authentication error: {str(e)}"
        )


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Payload data to encode in token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        data: Payload data to encode in token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string
        token_type: Expected token type ("access" or "refresh")
        
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        # Verify token type
        if payload.get("type") != token_type:
            return None
        
        # Check expiration
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
            return None
        
        return payload
        
    except JWTError:
        return None
    except Exception:
        return None


def get_token_expiry_seconds() -> int:
    """
    Get access token expiry time in seconds.
    
    Returns:
        Expiry time in seconds
    """
    return settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


def get_refresh_token_expiry_seconds() -> int:
    """
    Get refresh token expiry time in seconds.
    
    Returns:
        Expiry time in seconds
    """
    return settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60