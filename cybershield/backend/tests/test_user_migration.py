"""
Test file for user migration to MongoDB.
Tests user registration, login, profile, and XP updates.
"""
import pytest
from datetime import datetime
from bson import ObjectId

from app.repositories.user_repository import user_repository


class TestUserMigration:
    """Test class for user MongoDB operations."""
    
    def test_create_user(self):
        """Test creating a new user in MongoDB."""
        user_data = {
            "username": "testuser",
            "full_name": "Test User",
            "email": "testuser@example.com",
            "password_hash": "$2b$12$test_hash",
            "role": "student"
        }
        
        user_id = user_repository.create_user(user_data)
        
        assert user_id is not None
        assert ObjectId.is_valid(user_id)
        
        # Clean up
        user_repository.delete_user(user_id)
    
    def test_get_user_by_email(self):
        """Test retrieving a user by email."""
        user_data = {
            "username": "emailtest",
            "full_name": "Email Test",
            "email": "emailtest@example.com",
            "password_hash": "$2b$12$test_hash",
            "role": "student"
        }
        
        user_id = user_repository.create_user(user_data)
        
        # Get user by email
        user = user_repository.get_user_by_email("emailtest@example.com")
        
        assert user is not None
        assert user["email"] == "emailtest@example.com"
        assert user["username"] == "emailtest"
        
        # Clean up
        user_repository.delete_user(user_id)
    
    def test_get_user_by_username(self):
        """Test retrieving a user by username."""
        user_data = {
            "username": "usernametest",
            "full_name": "Username Test",
            "email": "usernametest@example.com",
            "password_hash": "$2b$12$test_hash",
            "role": "student"
        }
        
        user_id = user_repository.create_user(user_data)
        
        # Get user by username
        user = user_repository.get_user_by_username("usernametest")
        
        assert user is not None
        assert user["username"] == "usernametest"
        
        # Clean up
        user_repository.delete_user(user_id)
    
    def test_get_user_by_id(self):
        """Test retrieving a user by ID."""
        user_data = {
            "username": "idtest",
            "full_name": "ID Test",
            "email": "idtest@example.com",
            "password_hash": "$2b$12$test_hash",
            "role": "student"
        }
        
        user_id = user_repository.create_user(user_data)
        
        # Get user by ID
        user = user_repository.get_user_by_id(user_id)
        
        assert user is not None
        assert str(user["_id"]) == user_id
        
        # Clean up
        user_repository.delete_user(user_id)
    
    def test_update_user(self):
        """Test updating a user's information."""
        user_data = {
            "username": "updatetest",
            "full_name": "Update Test",
            "email": "updatetest@example.com",
            "password_hash": "$2b$12$test_hash",
            "role": "student"
        }
        
        user_id = user_repository.create_user(user_data)
        
        # Update user
        update_data = {
            "full_name": "Updated Name",
            "theme": "dark"
        }
        
        success = user_repository.update_user(user_id, update_data)
        
        assert success is True
        
        # Verify update
        user = user_repository.get_user_by_id(user_id)
        assert user["full_name"] == "Updated Name"
        assert user["theme"] == "dark"
        
        # Clean up
        user_repository.delete_user(user_id)
    
    def test_update_xp(self):
        """Test updating user XP using $inc operator."""
        user_data = {
            "username": "xptest",
            "full_name": "XP Test",
            "email": "xptest@example.com",
            "password_hash": "$2b$12$test_hash",
            "role": "student",
            "xp": 0
        }
        
        user_id = user_repository.create_user(user_data)
        
        # Add XP
        success = user_repository.update_xp(user_id, 100)
        
        assert success is True
        
        # Verify XP update
        user = user_repository.get_user_by_id(user_id)
        assert user["xp"] == 100
        
        # Add more XP
        user_repository.update_xp(user_id, 50)
        
        user = user_repository.get_user_by_id(user_id)
        assert user["xp"] == 150
        
        # Clean up
        user_repository.delete_user(user_id)
    
    def test_update_last_login(self):
        """Test updating user's last login timestamp."""
        user_data = {
            "username": "logintest",
            "full_name": "Login Test",
            "email": "logintest@example.com",
            "password_hash": "$2b$12$test_hash",
            "role": "student"
        }
        
        user_id = user_repository.create_user(user_data)
        
        # Update last login
        success = user_repository.update_last_login(user_id)
        
        assert success is True
        
        # Verify last login was set
        user = user_repository.get_user_by_id(user_id)
        assert user["last_login"] is not None
        
        # Clean up
        user_repository.delete_user(user_id)
    
    def test_verify_email(self):
        """Test email verification."""
        user_data = {
            "username": "verifytest",
            "full_name": "Verify Test",
            "email": "verifytest@example.com",
            "password_hash": "$2b$12$test_hash",
            "role": "student",
            "is_email_verified": False
        }
        
        user_id = user_repository.create_user(user_data)
        
        # Verify email
        success = user_repository.verify_email(user_id)
        
        assert success is True
        
        # Verify email was set
        user = user_repository.get_user_by_id(user_id)
        assert user["is_email_verified"] is True
        
        # Clean up
        user_repository.delete_user(user_id)
    
    def test_default_values(self):
        """Test that default values are set correctly on user creation."""
        user_data = {
            "username": "defaulttest",
            "email": "defaulttest@example.com",
            "password_hash": "$2b$12$test_hash"
        }
        
        user_id = user_repository.create_user(user_data)
        
        # Verify defaults
        user = user_repository.get_user_by_id(user_id)
        assert user["is_email_verified"] == False
        assert user["xp"] == 0
        assert user["level"] == 1
        assert user["skill_level"] == "Beginner"
        assert user["profile"]["bio"] == ""
        assert user["profile"]["avatar"] == ""
        assert user["preferences"]["theme"] == "light"
        assert user["preferences"]["learning_goal"] == ""
        assert user["notifications"]["daily_challenge"] == True
        assert user["created_at"] is not None
        assert user["updated_at"] is not None
        
        # Clean up
        user_repository.delete_user(user_id)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])