"""
Refresh token service for token management.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from jose import jwt as _jwt
from app.utils.security import create_refresh_token
from app.repositories.refresh_token_repository import refresh_token_repository
from app.repositories.session_repository import session_repository
from app.repositories.user_repository import user_repository
from app.config.settings import settings


def _decode_refresh(refresh_token: str):
    """Decode a refresh JWT without relying on the module-level verify_token
    (which can be shadowed by an async variant at runtime)."""
    try:
        payload = _jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
    except Exception:
        return None
    if payload.get("type") != "refresh":
        return None
    exp = payload.get("exp")
    if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
        return None
    return payload


def _is_expired(dt) -> bool:
    """True if `dt` is in the past. Tolerant of naive vs aware datetimes."""
    if not dt:
        return False
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt < datetime.now(timezone.utc)


class RefreshService:
    """Service for refresh token operations."""
    
    def __init__(self):
        self.refresh_repo = refresh_token_repository
        self.session_repo = session_repository
    
    async def store_refresh_token(
        self,
        user_id: str,
        token: str,
        device: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> bool:
        """
        Store a refresh token in the database.

        The stored record MUST match what `get_token_by_hash` looks up:
        the token is stored as a sha256 hash under `token_hash`, and the
        active flag is `is_revoked` (not `revoked`). Storing it inconsistently
        makes every refresh verification fail with 401.

        Args:
            user_id: User's MongoDB ObjectId as string
            token: Plain refresh token
            device: Device information
            ip_address: User's IP address

        Returns:
            True if successful, False otherwise
        """
        try:
            import hashlib
            from app.core.database import get_collection

            # Calculate expiry
            expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

            # Hash the token to match get_token_by_hash() (which re-hashes on lookup)
            token_hash = hashlib.sha256(token.encode()).hexdigest()

            # Store in database
            collection = get_collection("refresh_tokens")
            await collection.insert_one({
                "user_id": user_id,
                "token_hash": token_hash,
                "device": device,
                "ip_address": ip_address,
                "created_at": datetime.now(timezone.utc),
                "expires_at": expires_at,
                "is_revoked": False,
                "last_used": None
            })

            return True
        except Exception as e:
            print(f"Error storing refresh token: {e}")
            return False
    
    def create_refresh_token_for_user(self, user_id: str, device: Optional[str] = None, 
                                     ip_address: Optional[str] = None) -> Optional[str]:
        """
        Create a new refresh token for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            device: Device information
            ip_address: User's IP address
            
        Returns:
            Plain refresh token if successful, None otherwise
        """
        try:
            # Create JWT refresh token
            token_data = {
                "sub": user_id,
                "type": "refresh"
            }
            plain_token = create_refresh_token(token_data)
            
            # Calculate expiry
            expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
            
            # Store in database
            from app.models.refresh_token_model import RefreshTokenCreate
            token_create = RefreshTokenCreate(
                user_id=user_id,
                token_hash=plain_token,
                device=device,
                ip_address=ip_address,
                expires_at=expires_at
            )
            
            self.refresh_repo.create_refresh_token(token_create)
            
            return plain_token
        except Exception as e:
            print(f"Error creating refresh token: {e}")
            return None
    
    async def verify_refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """
        Verify a refresh token.

        Args:
            refresh_token: Plain refresh token

        Returns:
            Token payload if valid, None otherwise
        """
        try:
            payload = _decode_refresh(refresh_token)
            if not payload:
                return None

            # The refresh token is minted with data={"user_id": ...} (no "sub")
            user_id = payload.get("user_id") or payload.get("sub")
            if not user_id:
                return None

            # Check if token exists in database and is not revoked
            token_doc = await self.refresh_repo.get_token_by_hash(refresh_token)
            if not token_doc:
                return None

            # Check expiry
            expires_at = token_doc.get("expires_at")
            if _is_expired(expires_at):
                return None

            return {"user_id": user_id, "sub": user_id}
        except Exception as e:
            print(f"Error verifying refresh token: {e}")
            return None

    async def refresh_access_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """
        Generate a new access token using refresh token.

        Args:
            refresh_token: Plain refresh token

        Returns:
            Dict with new access token and expiry, or None if invalid
        """
        try:
            # Verify refresh token (decode directly to avoid async-shadows)
            payload = _decode_refresh(refresh_token)
            if not payload:
                return None

            # The refresh token is minted with data={"user_id": ...} (no "sub")
            user_id = payload.get("user_id") or payload.get("sub")
            if not user_id:
                return None

            # Check if token exists in database and is not revoked
            token_doc = await self.refresh_repo.get_token_by_hash(refresh_token)
            if not token_doc:
                return None

            # Check expiry
            expires_at = token_doc.get("expires_at")
            if _is_expired(expires_at):
                return None
            
            # Get user
            user = await user_repository.get_user_by_id(user_id)
            if not user:
                return None

            # Generate new access token
            access_token_data = {
                "sub": user["email"],
                "user_id": user_id,
                "role": user.get("role", "student")
            }
            new_access_token = create_refresh_token(access_token_data,
                expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            )

            # Update last_used timestamp
            await self.refresh_repo.update_last_used(str(token_doc["_id"]))

            # Update session activity
            session = await self.session_repo.get_session_by_token_hash(refresh_token)
            if session:
                await self.session_repo.update_session_activity(str(session["_id"]))
            
            return {
                "access_token": new_access_token,
                "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            }
            
        except Exception as e:
            print(f"Error refreshing access token: {e}")
            return None
    
    async def update_token_last_used(self, refresh_token: str) -> bool:
        """
        Update the last_used timestamp for a refresh token.

        Args:
            refresh_token: Plain refresh token

        Returns:
            True if successful, False otherwise
        """
        try:
            import hashlib
            from app.core.database import get_collection
            collection = get_collection("refresh_tokens")
            token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
            result = await collection.update_one(
                {"token_hash": token_hash},
                {"$set": {"last_used": datetime.now(timezone.utc)}}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating token last used: {e}")
            return False
    
    def revoke_refresh_token(self, refresh_token: str) -> bool:
        """
        Revoke a refresh token.
        
        Args:
            refresh_token: Plain refresh token
            
        Returns:
            True if successful, False otherwise
        """
        try:
            return self.refresh_repo.revoke_token(refresh_token)
        except Exception as e:
            print(f"Error revoking refresh token: {e}")
            return False
    
    def revoke_all_user_tokens(self, user_id: str) -> bool:
        """
        Revoke all refresh tokens for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            return self.refresh_repo.revoke_all_user_tokens(user_id)
        except Exception as e:
            print(f"Error revoking all user tokens: {e}")
            return False


# Create singleton instance
refresh_service = RefreshService()