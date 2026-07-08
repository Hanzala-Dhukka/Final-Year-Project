"""
Database routes for testing MongoDB connection.
"""
from fastapi import APIRouter, HTTPException
from app.core.database import get_database, get_client
from app.core.config import settings

router = APIRouter()


@router.get("/test", tags=["Database"])
def test_database_connection():
    """
    Test MongoDB database connection.
    
    Returns:
        dict: Connection status with database name
    """
    try:
        # Try to get the database and ping
        client = get_client()
        database = get_database()
        
        # Ping the database to verify connection
        client.admin.command('ping')
        
        return {
            "success": True,
            "database": settings.DATABASE_NAME,
            "status": "Connected"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )