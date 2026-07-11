"""
Verification script to test dashboard API endpoints.
This script tests the fixes for CORS and JWT issues.
"""
import asyncio
import sys
import os
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from jose import jwt
from app.config.settings import settings
from app.repositories.user_repository import user_repository
from app.routes.dashboard_routes import router as dashboard_router
from fastapi.testclient import TestClient
from fastapi import FastAPI
from app.main import app as fastapi_app

USER_ID = "6a4ffa43ddf2f5b0d055f882"


def test_jwt_token_creation():
    """Test that JWT tokens can be created and decoded properly."""
    print("=" * 60)
    print("TEST 1: JWT Token Creation and Validation")
    print("=" * 60)
    
    try:
        # Create a test token
        test_data = {"user_id": USER_ID, "role": "student"}
        token = jwt.encode(
            test_data,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        print(f"✓ Token created successfully")
        
        # Decode the token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        print(f"✓ Token decoded successfully")
        print(f"  User ID: {payload.get('user_id')}")
        print(f"  Role: {payload.get('role')}")
        
        return True
    except Exception as e:
        print(f"✗ JWT Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_cors_configuration():
    """Test that CORS is configured correctly."""
    print("\n" + "=" * 60)
    print("TEST 2: CORS Configuration")
    print("=" * 60)
    
    try:
        # Read the main.py file to verify CORS configuration
        with open('app/main.py', 'r') as f:
            content = f.read()
        
        # Check if localhost:5173 is in the CORS configuration
        if 'http://localhost:5173' in content and 'allow_origins' in content:
            print(f"✓ CORS middleware configured in main.py")
            print(f"✓ localhost:5173 is in allowed origins")
            
            # Verify allow_credentials is True
            if 'allow_credentials=True' in content:
                print(f"✓ allow_credentials is enabled")
                return True
            else:
                print(f"✗ allow_credentials is NOT enabled")
                return False
        else:
            print(f"✗ CORS not properly configured")
            return False
            
    except Exception as e:
        print(f"✗ CORS Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_dashboard_endpoint():
    """Test the dashboard endpoint with authentication."""
    print("\n" + "=" * 60)
    print("TEST 3: Dashboard Endpoint")
    print("=" * 60)
    
    try:
        client = TestClient(fastapi_app)
        
        # Create a test user and token
        async def get_test_token():
            user = await user_repository.get_user_by_id(USER_ID)
            if not user:
                print(f"✗ Test user not found")
                return None
            
            # Create token
            token_data = {
                "user_id": USER_ID,
                "role": user.get("role", "student")
            }
            token = jwt.encode(
                token_data,
                settings.SECRET_KEY,
                algorithm=settings.ALGORITHM
            )
            return token
        
        token = asyncio.run(get_test_token())
        if not token:
            return False
        
        print(f"✓ Test token created")
        
        # Test dashboard endpoint
        response = client.get(
            f"/api/v1/dashboard/{USER_ID}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✓ Dashboard endpoint returned 200 OK")
            data = response.json()
            print(f"  Dashboard keys: {list(data.keys())}")
            return True
        elif response.status_code == 500:
            print(f"✗ Dashboard endpoint returned 500 error")
            print(f"  Response: {response.text}")
            return False
        else:
            print(f"✗ Dashboard endpoint returned {response.status_code}")
            print(f"  Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Dashboard Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_auth_me_endpoint():
    """Test the /api/v1/auth/me endpoint."""
    print("\n" + "=" * 60)
    print("TEST 4: Auth /me Endpoint")
    print("=" * 60)
    
    try:
        client = TestClient(fastapi_app)
        
        # Create a test token
        async def get_test_token():
            user = await user_repository.get_user_by_id(USER_ID)
            if not user:
                print(f"✗ Test user not found")
                return None
            
            token_data = {
                "user_id": USER_ID,
                "role": user.get("role", "student")
            }
            token = jwt.encode(
                token_data,
                settings.SECRET_KEY,
                algorithm=settings.ALGORITHM
            )
            return token
        
        token = asyncio.run(get_test_token())
        if not token:
            return False
        
        print(f"✓ Test token created")
        
        # Test auth/me endpoint
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✓ Auth /me endpoint returned 200 OK")
            data = response.json()
            print(f"  User: {data.get('name')} ({data.get('email')})")
            return True
        elif response.status_code == 500:
            print(f"✗ Auth /me endpoint returned 500 error")
            print(f"  Response: {response.text}")
            return False
        else:
            print(f"✗ Auth /me endpoint returned {response.status_code}")
            print(f"  Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Auth Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all verification tests."""
    print("\n" + "=" * 60)
    print("DASHBOARD FIX VERIFICATION")
    print("=" * 60)
    
    results = []
    
    # Test 1: JWT
    results.append(("JWT Token Creation", test_jwt_token_creation()))
    
    # Test 2: CORS
    results.append(("CORS Configuration", test_cors_configuration()))
    
    # Test 3: Auth endpoint
    results.append(("Auth /me Endpoint", test_auth_me_endpoint()))
    
    # Test 4: Dashboard endpoint
    results.append(("Dashboard Endpoint", test_dashboard_endpoint()))
    
    # Summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    all_passed = all(result for _, result in results)
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✓ ALL TESTS PASSED - Dashboard should work correctly!")
    else:
        print("✗ SOME TESTS FAILED - Please review errors above")
    print("=" * 60)
    
    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)