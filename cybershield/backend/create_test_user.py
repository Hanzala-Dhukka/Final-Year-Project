"""
Create a test user with known credentials
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.repositories.user_repository import user_repository
from app.services.password_service import password_service
from datetime import datetime, timezone

async def create_test_user():
    """Create a test user with known credentials"""
    email = "test@example.com"
    password = "Test123!"
    
    # Check if user already exists
    existing = await user_repository.get_user_by_email(email)
    if existing:
        print(f"Test user already exists with email: {email}")
        print(f"User ID: {existing['_id']}")
        return
    
    # Hash password
    password_hash = password_service.hash_password(password)
    
    # Create user
    user_data = {
        "name": "Test User",
        "email": email,
        "password_hash": password_hash,
        "role": "student",
        "is_verified": True,
        "account_status": "active",
        "created_at": datetime.now(timezone.utc),
        "last_login": None
    }
    
    user_id = await user_repository.create_user(user_data)
    if user_id:
        print(f"✓ Test user created successfully!")
        print(f"  Email: {email}")
        print(f"  Password: {password}")
        print(f"  User ID: {user_id}")
    else:
        print("✗ Failed to create test user")

if __name__ == "__main__":
    asyncio.run(create_test_user())