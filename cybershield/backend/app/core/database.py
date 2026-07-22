"""
Database module for CyberShield application.
Provides MongoDB connection management with singleton pattern.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from motor.motor_asyncio import AsyncIOMotorDatabase
from motor.motor_asyncio import AsyncIOMotorCollection
from typing import Optional
from app.core.config import settings

# Global client and database instances
_client: Optional[AsyncIOMotorClient] = None
_database: Optional[AsyncIOMotorDatabase] = None


def get_client() -> AsyncIOMotorClient:
    """
    Get or create an async MongoDB client instance.
    Uses singleton pattern to ensure single connection.
    
    Returns:
        AsyncIOMotorClient: The MongoDB client instance
    """
    global _client
    
    if _client is None:
        try:
            _client = AsyncIOMotorClient(settings.MONGODB_URI)
            print(f"MongoDB client connected successfully to {settings.MONGODB_URI}")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise
    
    return _client


def get_database() -> AsyncIOMotorDatabase:
    """
    Get or create a MongoDB database instance.
    Uses singleton pattern to ensure single database reference.
    
    Returns:
        AsyncIOMotorDatabase: The MongoDB database instance
    """
    global _database
    
    if _database is None:
        client = get_client()
        _database = client[settings.DATABASE_NAME]
        print(f"Database '{settings.DATABASE_NAME}' selected")
    
    return _database


def get_collection(collection_name: str) -> AsyncIOMotorCollection:
    """
    Get a specific collection from the database.
    
    Args:
        collection_name: Name of the collection to retrieve
        
    Returns:
        AsyncIOMotorCollection: The MongoDB collection instance
    """
    database = get_database()
    return database[collection_name]


async def close_connection():
    """Close the MongoDB client connection."""
    global _client, _database
    
    if _client is not None:
        _client.close()
        _client = None
        _database = None
        print("MongoDB connection closed")


async def ensure_collections():
    """
    Ensure all required collections exist.
    This is called on application startup.
    """
    database = get_database()
    collections = await database.list_collection_names()
    
    required_collections = [
        "users",
        "scans",
        "threat_reports",
        "vulnerabilities",
        "owasp_sessions",
        "quiz_attempts",
        "glossary_progress",
        "conversations",
        "achievements",
        "certificates",
        "daily_challenges",
        "user_progress",
        "sessions",
        "refresh_tokens",
        "audit_logs",
        "security_checklists",
        "user_checklists",
        "checklist_progress",
        "generated_checklists",
        "compliance_reports",
        "compliance_history",
        "analytics_snapshots",
        "notifications",
        "automation_rules",
        "scheduled_scans",
        "security_activity",
        "email_logs"
    ]
    
    for collection_name in required_collections:
        if collection_name not in collections:
            await database.create_collection(collection_name)
            print(f"Collection '{collection_name}' created")
        else:
            print(f"Collection '{collection_name}' already exists")


async def create_indexes():
    """
    Create database indexes for optimal query performance.
    """
    try:
        # Users collection indexes
        users_collection = get_collection("users")
        await users_collection.create_index("email", unique=True)
        # Drop old non-sparse unique index on user_id if it exists, then recreate as sparse
        # so documents with user_id=null don't cause E11000 duplicate key errors
        try:
            await users_collection.drop_index("user_id_1")
        except Exception:
            pass  # Index didn't exist yet, that's fine
        await users_collection.create_index("user_id", unique=True, sparse=True)
        await users_collection.create_index("created_at")
        print("Indexes created for 'users' collection")
        
        # Security reports indexes
        reports_collection = get_collection("security_reports")
        await reports_collection.create_index("user_id")
        await reports_collection.create_index("created_at")
        await reports_collection.create_index([("user_id", 1), ("created_at", -1)])
        print("Indexes created for 'security_reports' collection")
        
        # AI conversations indexes
        chat_collection = get_collection("ai_conversations")
        await chat_collection.create_index("conversation_id", unique=True)
        await chat_collection.create_index("user_id")
        await chat_collection.create_index("last_message_at")
        await chat_collection.create_index([("user_id", 1), ("last_message_at", -1)])
        print("Indexes created for 'ai_conversations' collection")
        
        # Progress indexes
        progress_collection = get_collection("progress")
        # Drop old non-sparse unique index on user_id if it exists, then recreate as sparse
        try:
            await progress_collection.drop_index("user_id_1")
        except Exception:
            pass  # Index didn't exist yet, that's fine
        await progress_collection.create_index("user_id", unique=True, sparse=True)
        await progress_collection.create_index("updated_at")
        print("Indexes created for 'progress' collection")
        
        # Quiz attempts indexes
        quiz_collection = get_collection("quiz_attempts")
        await quiz_collection.create_index("user_id")
        await quiz_collection.create_index("completed_at")
        await quiz_collection.create_index([("user_id", 1), ("completed_at", -1)])
        print("Indexes created for 'quiz_attempts' collection")
        
        # Lab attempts indexes
        lab_collection = get_collection("lab_attempts")
        await lab_collection.create_index("user_id")
        await lab_collection.create_index("started_at")
        await lab_collection.create_index([("user_id", 1), ("started_at", -1)])
        print("Indexes created for 'lab_attempts' collection")
        
        # Sessions indexes
        sessions_collection = get_collection("sessions")
        await sessions_collection.create_index("user_id")
        await sessions_collection.create_index("active")
        await sessions_collection.create_index("login_time")
        print("Indexes created for 'sessions' collection")
        
        # Refresh tokens indexes
        tokens_collection = get_collection("refresh_tokens")
        await tokens_collection.create_index("token_hash", unique=True)
        await tokens_collection.create_index("user_id")
        await tokens_collection.create_index("expires_at")
        print("Indexes created for 'refresh_tokens' collection")
        
        # Notifications indexes
        notif_collection = get_collection("notifications")
        await notif_collection.create_index([("user_id", 1), ("created_at", -1)])
        await notif_collection.create_index("read")
        # Scheduled scans indexes
        await get_collection("scheduled_scans").create_index([("user_id", 1), ("project_id", 1)])
        await get_collection("scheduled_scans").create_index("next_run")
        # Automation rules indexes
        await get_collection("automation_rules").create_index("user_id")
        # Security activity indexes
        await get_collection("security_activity").create_index([("user_id", 1), ("created_at", -1)])
        await get_collection("security_activity").create_index([("project_id", 1), ("created_at", -1)])
        # Email logs indexes
        await get_collection("email_logs").create_index("created_at")
        print("All database indexes created successfully")
        
    except Exception as e:
        print(f"Error creating indexes: {e}")


# For FastAPI startup event
async def connect_to_mongo():
    """Connect to MongoDB on application startup."""
    get_client()
    await ensure_collections()
    await create_indexes()
    print("MongoDB setup complete")


async def close_mongo_connection():
    """Close MongoDB connection on application shutdown."""
    await close_connection()