"""
Authentication dependencies for token verification.
"""
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from bson.errors import InvalidId

from app.core.config import settings
from app.database.db import database

security = HTTPBearer()
SESSION_TIMEOUT_MINUTES = 30


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get current user from JWT token with session timeout check.
    
    Args:
        credentials: HTTP Bearer credentials
        
    Returns:
        User document from MongoDB
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
            raise HTTPException(status_code=401, detail="Invalid token payload")

        # MongoDB stores _id as an ObjectId, so the string from the token
        # must be converted before querying (otherwise the lookup never matches).
        try:
            user_object_id = ObjectId(user_id)
        except (InvalidId, TypeError):
            raise HTTPException(status_code=401, detail="Invalid user identifier")

        user = await database.users.find_one({"_id": user_object_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Check session timeout (use timezone-aware "now" so it is comparable
        # with last_activity, which is stored as an aware UTC datetime).
        #
        # The authoritative "last activity" lives on the per-session record in
        # the `sessions` collection (refreshed on every request by the activity
        # tracker middleware). The user document's `last_activity` is only
        # touched opportunistically and can go stale, which would wrongly log
        # users out despite a valid token. Prefer the session record, fall back
        # to the user document.
        last_activity = None
        try:
            session = await database.sessions.find_one(
                {"user_id": str(user_object_id), "active": True},
                sort=[("last_activity", -1)],
            )
            if session and session.get("last_activity"):
                last_activity = session["last_activity"]
        except Exception:
            last_activity = None
        if last_activity is None:
            last_activity = user.get("last_activity")

        if last_activity:
            # Normalize to aware UTC in case an older value was stored naive.
            if last_activity.tzinfo is None:
                last_activity = last_activity.replace(tzinfo=timezone.utc)
            time_diff = datetime.now(timezone.utc) - last_activity
            if time_diff > timedelta(minutes=SESSION_TIMEOUT_MINUTES):
                raise HTTPException(
                    status_code=401,
                    detail="Session expired due to inactivity"
                )
        
        # Update last activity on both the session record and the user doc so
        # the idle timer stays accurate for every authenticated request.
        await database.users.update_one(
            {"_id": user_object_id},
            {"$set": {"last_activity": datetime.now(timezone.utc)}}
        )
        try:
            await database.sessions.update_one(
                {"user_id": str(user_object_id), "active": True},
                {"$set": {"last_activity": datetime.now(timezone.utc)}},
                sort=[("last_activity", -1)],
            )
        except Exception:
            pass

        # Return _id as a string so downstream responses are JSON-serializable
        # (raw bson ObjectId cannot be serialized by FastAPI).
        user = dict(user)
        user["_id"] = str(user["_id"])
        return user
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )