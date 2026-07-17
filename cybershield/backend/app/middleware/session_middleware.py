from fastapi import Request, HTTPException
from app.database.db import database
from datetime import datetime, timedelta
from app.core.config import settings

SESSION_TIMEOUT_MINUTES = getattr(settings, 'SESSION_TIMEOUT_MINUTES', 30)

async def check_session_timeout(user_id: str):
    """
    Check if user session has timed out (30 minutes of inactivity).
    """
    user = await database.users.find_one({"_id": user_id})
    
    if not user:
        return False
    
    last_activity = user.get("last_activity")
    
    if last_activity:
        # Calculate time difference
        time_diff = datetime.utcnow() - last_activity
        if time_diff > timedelta(minutes=SESSION_TIMEOUT_MINUTES):
            # Session has timed out
            return True
    
    return False

async def update_user_activity(user_id: str):
    """
    Update user's last activity timestamp.
    """
    await database.users.update_one(
        {"_id": user_id},
        {"$set": {"last_activity": datetime.utcnow()}}
    )
