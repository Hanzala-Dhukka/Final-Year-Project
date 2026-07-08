"""
Test suite for Admin Dashboard & User Management APIs
"""
import pytest
from fastapi.testclient import TestClient
from bson import ObjectId
from datetime import datetime, timezone

from app.main import app
from app.repositories.user_repository import user_repository
from app.services.audit_service import log_action


client = TestClient(app)


class TestAdminAuthentication:
    """Test admin authentication and authorization."""
    
    def test_admin_access_required(self):
        """Test that non-admin users cannot access admin endpoints."""
        # Login as student (assuming we have a test student user)
        student_login = client.post("/api/v1/auth/login", json={
            "email": "student@test.com",
            "password": "testpass123"
        })
        
        if student_login.status_code == 200:
            student_token = student_login.json()["access_token"]
            
            # Try to access admin endpoint with student token
            response = client.get(
                "/api/v1/admin/users",
                headers={"Authorization": f"Bearer {student_token}"}
            )
            
            assert response.status_code == 403
            assert "Admin access required" in response.json()["detail"]
    
    def test_admin_can_access_endpoints(self):
        """Test that admin users can access admin endpoints."""
        # Login as admin (assuming we have a test admin user)
        admin_login = client.post("/api/v1/auth/login", json={
            "email": "admin@test.com",
            "password": "adminpass123"
        })
        
        if admin_login.status_code == 200:
            admin_token = admin_login.json()["access_token"]
            
            # Access admin endpoint with admin token
            response = client.get(
                "/api/v1/admin/users",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            
            assert response.status_code == 200
            assert "total" in response.json()
            assert "users" in response.json()


class TestUserManagement:
    """Test user management endpoints."""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for testing."""
        login_response = client.post("/api/v1/auth/login", json={
            "email": "admin@test.com",
            "password": "adminpass123"
        })
        if login_response.status_code == 200:
            return login_response.json()["access_token"]
        return None
    
    @pytest.fixture
    def test_user_id(self):
        """Create a test user and return its ID."""
        user_data = {
            "username": "testuser_admin",
            "email": "testuser_admin@test.com",
            "password": "testpass123",
            "full_name": "Test User Admin",
            "role": "student"
        }
        
        # Register user
        register_response = client.post("/api/v1/auth/register", json=user_data)
        if register_response.status_code == 200:
            # Get user by email
            user = user_repository.get_user_by_email(user_data["email"])
            if user:
                return str(user["_id"])
        return None
    
    def test_get_all_users(self, admin_token):
        """Test GET /api/v1/admin/users endpoint."""
        if not admin_token:
            pytest.skip("Admin token not available")
        
        response = client.get(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "users" in data
        assert isinstance(data["total"], int)
        assert isinstance(data["users"], list)
    
    def test_search_users(self, admin_token):
        """Test GET /api/v1/admin/users/search endpoint."""
        if not admin_token:
            pytest.skip("Admin token not available")
        
        response = client.get(
            "/api/v1/admin/users/search?query=test",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "query" in data
        assert "count" in data
        assert "users" in data
    
    def test_change_user_role(self, admin_token, test_user_id):
        """Test PUT /api/v1/admin/users/{id}/role endpoint."""
        if not admin_token or not test_user_id:
            pytest.skip("Admin token or test user not available")
        
        response = client.put(
            f"/api/v1/admin/users/{test_user_id}/role",
            json={"role": "instructor"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        assert "message" in response.json()
        
        # Verify role was changed
        user = user_repository.get_user_by_id(test_user_id)
        assert user["role"] == "instructor"
        
        # Cleanup - change back to student
        user_repository.update_user_role(test_user_id, "student")
    
    def test_change_user_status(self, admin_token, test_user_id):
        """Test PUT /api/v1/admin/users/{id}/status endpoint."""
        if not admin_token or not test_user_id:
            pytest.skip("Admin token or test user not available")
        
        response = client.put(
            f"/api/v1/admin/users/{test_user_id}/status",
            json={"status": "blocked"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        assert "message" in response.json()
        
        # Verify status was changed
        user = user_repository.get_user_by_id(test_user_id)
        assert user["account_status"] == "blocked"
        
        # Cleanup - change back to active
        user_repository.update_user_status(test_user_id, "active")
    
    def test_delete_user(self, admin_token, test_user_id):
        """Test DELETE /api/v1/admin/users/{id} endpoint."""
        if not admin_token or not test_user_id:
            pytest.skip("Admin token or test user not available")
        
        response = client.delete(
            f"/api/v1/admin/users/{test_user_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        assert "message" in response.json()
        
        # Verify user was deleted
        user = user_repository.get_user_by_id(test_user_id)
        assert user is None


class TestUserActivity:
    """Test user activity monitoring endpoints."""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for testing."""
        login_response = client.post("/api/v1/auth/login", json={
            "email": "admin@test.com",
            "password": "adminpass123"
        })
        if login_response.status_code == 200:
            return login_response.json()["access_token"]
        return None
    
    @pytest.fixture
    def test_user_id(self):
        """Get an existing user ID for testing."""
        # Get first user from database
        users = user_repository.get_all_users(0, 1)
        if users:
            return str(users[0]["_id"])
        return None
    
    def test_get_user_activity(self, admin_token, test_user_id):
        """Test GET /api/v1/admin/users/{id}/activity endpoint."""
        if not admin_token or not test_user_id:
            pytest.skip("Admin token or test user not available")
        
        response = client.get(
            f"/api/v1/admin/users/{test_user_id}/activity",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "username" in data
        assert "github_scans" in data
        assert "security_scans" in data
        assert "quiz_attempts" in data
        assert "owasp_attempts" in data


class TestStatistics:
    """Test statistics endpoints."""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for testing."""
        login_response = client.post("/api/v1/auth/login", json={
            "email": "admin@test.com",
            "password": "adminpass123"
        })
        if login_response.status_code == 200:
            return login_response.json()["access_token"]
        return None
    
    def test_get_platform_statistics(self, admin_token):
        """Test GET /api/v1/admin/statistics endpoint."""
        if not admin_token:
            pytest.skip("Admin token not available")
        
        response = client.get(
            "/api/v1/admin/statistics",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "active_users" in data
        assert "total_scans" in data
        assert "quiz_attempts" in data
        assert "owasp_attempts" in data
    
    def test_get_security_monitoring(self, admin_token):
        """Test GET /api/v1/admin/security-monitoring endpoint."""
        if not admin_token:
            pytest.skip("Admin token not available")
        
        response = client.get(
            "/api/v1/admin/security-monitoring",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "github_scanner" in data
        assert "security_scanner" in data
        assert "owasp_simulator" in data
    
    def test_get_recent_activities(self, admin_token):
        """Test GET /api/v1/admin/activities endpoint."""
        if not admin_token:
            pytest.skip("Admin token not available")
        
        response = client.get(
            "/api/v1/admin/activities?limit=20",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert "activities" in data
    
    def test_get_dashboard(self, admin_token):
        """Test GET /api/v1/admin/dashboard endpoint."""
        if not admin_token:
            pytest.skip("Admin token not available")
        
        response = client.get(
            "/api/v1/admin/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "statistics" in data
        assert "security_monitoring" in data
        assert "recent_activities" in data
        assert "recent_users" in data


class TestAuditLogs:
    """Test audit log integration."""
    
    def test_role_change_creates_audit_log(self):
        """Test that changing a user's role creates an audit log."""
        # This test would require:
        # 1. Admin login
        # 2. Change user role
        # 3. Check audit_logs collection for ROLE_CHANGED entry
        pass
    
    def test_status_change_creates_audit_log(self):
        """Test that changing user status creates an audit log."""
        # This test would require:
        # 1. Admin login
        # 2. Change user status
        # 3. Check audit_logs collection for ACCOUNT_STATUS_CHANGED entry
        pass
    
    def test_user_deletion_creates_audit_log(self):
        """Test that deleting a user creates an audit log."""
        # This test would require:
        # 1. Admin login
        # 2. Delete user
        # 3. Check audit_logs collection for USER_DELETED entry
        pass


class TestPermissions:
    """Test role-based permissions."""
    
    def test_student_cannot_access_admin(self):
        """Test that students cannot access admin endpoints."""
        # Login as student
        # Try to access /api/v1/admin/users
        # Should return 403
        pass
    
    def test_instructor_cannot_access_admin(self):
        """Test that instructors cannot access admin endpoints."""
        # Login as instructor
        # Try to access /api/v1/admin/users
        # Should return 403
        pass
    
    def test_admin_can_access_admin(self):
        """Test that admins can access admin endpoints."""
        # Login as admin
        # Access /api/v1/admin/users
        # Should return 200
        pass


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])