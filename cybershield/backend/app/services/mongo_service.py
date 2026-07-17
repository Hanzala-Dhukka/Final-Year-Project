"""
MongoDB Service for Progress Tracking
Replaces Google Sheets storage with MongoDB
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import os
from motor import motor_asyncio
from pymongo import MongoClient

# MongoDB configuration
# Load .env so DATABASE_NAME resolves to the configured value (CyberShieldDB)
# instead of the legacy lowercase "cybershield" fallback.
try:
    from dotenv import load_dotenv
    load_dotenv(override=True)
except Exception:
    pass
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "CyberShieldDB")

# Initialize MongoDB client
def get_mongo_client():
    """Get MongoDB client"""
    try:
        client = MongoClient(MONGO_URI)
        return client
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return None


def get_database():
    """Get database instance"""
    client = get_mongo_client()
    if client:
        return client[DATABASE_NAME]
    return None


# User Progress Collection
def save_user_progress(user_id: str, xp: int, level: int, labs: int, 
                      avg_score: float, skill: str, last_login: str) -> bool:
    """
    Save user progress to MongoDB
    
    Args:
        user_id: User identifier
        xp: Total XP
        level: Current level
        labs: Completed labs count
        avg_score: Average score
        skill: Skill level
        last_login: Last login timestamp
    
    Returns:
        bool: True if saved successfully, False otherwise
    """
    db = get_database()
    if db is None:
        return False
    
    try:
        collection = db["user_progress"]
        
        # Update or insert
        collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "xp": xp,
                    "level": level,
                    "completed_labs": labs,
                    "average_score": avg_score,
                    "skill": skill,
                    "last_login": last_login,
                    "updated_at": datetime.now().isoformat()
                }
            },
            upsert=True
        )
        return True
    except Exception as e:
        print(f"Error saving user progress to MongoDB: {e}")
        return False


def get_user_progress(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get user progress from MongoDB
    
    Args:
        user_id: User identifier
    
    Returns:
        User progress data or None
    """
    db = get_database()
    if db is None:
        return None
    
    try:
        collection = db["user_progress"]
        return collection.find_one({"user_id": user_id})
    except Exception as e:
        print(f"Error getting user progress from MongoDB: {e}")
        return None


def get_all_users_progress() -> List[Dict[str, Any]]:
    """
    Get all users progress from MongoDB
    
    Returns:
        List of all user progress records
    """
    db = get_database()
    if db is None:
        return []
    
    try:
        collection = db["user_progress"]
        return list(collection.find({}))
    except Exception as e:
        print(f"Error getting all users progress from MongoDB: {e}")
        return []


# Achievements Collection
def save_achievement(user_id: str, badge: str, date: str) -> bool:
    """
    Save achievement to MongoDB
    
    Args:
        user_id: User identifier
        badge: Badge name
        date: Date earned
    
    Returns:
        bool: True if saved successfully, False otherwise
    """
    db = get_database()
    if db is None:
        return False
    
    try:
        collection = db["achievements"]
        
        collection.insert_one({
            "user_id": user_id,
            "badge": badge,
            "date": date,
            "created_at": datetime.now().isoformat()
        })
        return True
    except Exception as e:
        print(f"Error saving achievement to MongoDB: {e}")
        return False


def get_user_achievements(user_id: str) -> List[str]:
    """
    Get user achievements from MongoDB
    
    Args:
        user_id: User identifier
    
    Returns:
        List of badge names
    """
    db = get_database()
    if db is None:
        return []
    
    try:
        collection = db["achievements"]
        records = collection.find({"user_id": user_id})
        return [r["badge"] for r in records]
    except Exception as e:
        print(f"Error getting user achievements from MongoDB: {e}")
        return []


# Certificates Collection
def save_certificate(user_id: str, certificate_id: str, course: str, 
                     date: str, file_path: str) -> bool:
    """
    Save certificate to MongoDB
    
    Args:
        user_id: User identifier
        certificate_id: Certificate ID
        course: Course name
        date: Date issued
        file_path: Path to PDF file
    
    Returns:
        bool: True if saved successfully, False otherwise
    """
    db = get_database()
    if db is None:
        return False
    
    try:
        collection = db["certificates"]
        
        collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "certificate_id": certificate_id,
                    "course": course,
                    "date": date,
                    "file_path": file_path,
                    "created_at": datetime.now().isoformat()
                }
            },
            upsert=True
        )
        return True
    except Exception as e:
        print(f"Error saving certificate to MongoDB: {e}")
        return False


def get_user_certificate(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get user certificate from MongoDB
    
    Args:
        user_id: User identifier
    
    Returns:
        Certificate data or None
    """
    db = get_database()
    if db is None:
        return None
    
    try:
        collection = db["certificates"]
        return collection.find_one({"user_id": user_id})
    except Exception as e:
        print(f"Error getting user certificate from MongoDB: {e}")
        return None


# Lab Attempts Collection
def save_lab_attempt(user_id: str, lab_id: str, category: str, 
                     score: int, attempts: int, success: bool) -> bool:
    """
    Save lab attempt to MongoDB
    
    Args:
        user_id: User identifier
        lab_id: Lab ID
        category: Category name
        score: Score achieved
        attempts: Number of attempts
        success: Whether lab was completed successfully
    
    Returns:
        bool: True if saved successfully, False otherwise
    """
    db = get_database()
    if db is None:
        return False
    
    try:
        collection = db["lab_attempts"]
        
        collection.insert_one({
            "user_id": user_id,
            "lab_id": lab_id,
            "category": category,
            "score": score,
            "attempts": attempts,
            "success": success,
            "timestamp": datetime.now().isoformat()
        })
        return True
    except Exception as e:
        print(f"Error saving lab attempt to MongoDB: {e}")
        return False


def get_user_lab_attempts(user_id: str) -> List[Dict[str, Any]]:
    """
    Get user lab attempts from MongoDB
    
    Args:
        user_id: User identifier
    
    Returns:
        List of lab attempts
    """
    db = get_database()
    if db is None:
        return []
    
    try:
        collection = db["lab_attempts"]
        return list(collection.find({"user_id": user_id}))
    except Exception as e:
        print(f"Error getting user lab attempts from MongoDB: {e}")
        return []


# Learning History Collection
def save_learning_history(user_id: str, topic: str, attempts: int, 
                        correct: int, weakness: str = None, 
                        skill_level: str = "Beginner", 
                        last_score: float = 0.0) -> bool:
    """
    Save learning history to MongoDB
    
    Args:
        user_id: User identifier
        topic: Topic name
        attempts: Total attempts
        correct: Correct attempts
        weakness: Optional weakness area
        skill_level: User's skill level
        last_score: Last score achieved
    
    Returns:
        bool: True if saved successfully, False otherwise
    """
    db = get_database()
    if db is None:
        return False
    
    try:
        collection = db["learning_history"]
        
        collection.update_one(
            {"user_id": user_id, "topic": topic},
            {
                "$set": {
                    "attempts": attempts,
                    "correct": correct,
                    "weakness": weakness,
                    "skill_level": skill_level,
                    "last_score": last_score,
                    "last_updated": datetime.now().isoformat()
                }
            },
            upsert=True
        )
        return True
    except Exception as e:
        print(f"Error saving learning history to MongoDB: {e}")
        return False


def get_user_learning_history(user_id: str, topic: str = None) -> List[Dict[str, Any]]:
    """
    Get user learning history from MongoDB
    
    Args:
        user_id: User identifier
        topic: Optional topic filter
    
    Returns:
        List of learning history records
    """
    db = get_database()
    if db is None:
        return []
    
    try:
        collection = db["learning_history"]
        
        query = {"user_id": user_id}
        if topic:
            query["topic"] = topic
        
        return list(collection.find(query))
    except Exception as e:
        print(f"Error getting user learning history from MongoDB: {e}")
        return []