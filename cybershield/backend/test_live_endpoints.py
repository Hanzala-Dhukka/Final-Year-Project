"""
Test live endpoints to identify the exact error
"""
import requests
import json

BASE_URL = "http://localhost:8000"
USER_ID = "6a5124dd7416ee90f65db5ca"  # Test user ID

def test_auth_me():
    """Test the /api/v1/auth/me endpoint with a test token"""
    print("=" * 60)
    print("Testing /api/v1/auth/me endpoint")
    print("=" * 60)
    
    # First, let's try to login to get a real token
    login_data = {
        "email": "test@example.com",
        "password": "Test123!"
    }
    
    try:
        # Try login
        login_response = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            json=login_data
        )
        
        print(f"Login Status: {login_response.status_code}")
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            print(f"✓ Got access token")
            
            # Test auth/me with the token
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=headers)
            
            print(f"Auth /me Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                print("✓ Auth /me endpoint working!")
                return token
            else:
                print(f"✗ Auth /me failed with {response.status_code}")
                return None
        else:
            print(f"✗ Login failed: {login_response.text}")
            return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None


def test_dashboard(token):
    """Test the dashboard endpoint"""
    print("\n" + "=" * 60)
    print("Testing /api/v1/dashboard/{user_id} endpoint")
    print("=" * 60)
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/api/v1/dashboard/{USER_ID}",
            headers=headers
        )
        
        print(f"Dashboard Status: {response.status_code}")
        print(f"Response: {response.text[:500]}")  # First 500 chars
        
        if response.status_code == 200:
            print("✓ Dashboard endpoint working!")
            return True
        else:
            print(f"✗ Dashboard failed with {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_cors():
    """Test CORS headers"""
    print("\n" + "=" * 60)
    print("Testing CORS headers")
    print("=" * 60)
    
    try:
        # Send an OPTIONS request (preflight)
        headers = {
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization"
        }
        
        response = requests.options(f"{BASE_URL}/api/v1/auth/me", headers=headers)
        
        print(f"CORS Status: {response.status_code}")
        print(f"Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin')}")
        print(f"Access-Control-Allow-Credentials: {response.headers.get('Access-Control-Allow-Credentials')}")
        
        if response.headers.get('Access-Control-Allow-Origin') == 'http://localhost:5173':
            print("✓ CORS configured correctly!")
            return True
        else:
            print("✗ CORS not configured correctly")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def main():
    print("\n" + "=" * 60)
    print("LIVE ENDPOINT TESTING")
    print("=" * 60)
    
    # Test CORS first
    cors_ok = test_cors()
    
    # Test auth endpoint
    token = test_auth_me()
    
    if token:
        # Test dashboard endpoint
        dashboard_ok = test_dashboard(token)
    else:
        print("\n⚠ Could not get token, skipping dashboard test")
        dashboard_ok = False
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"{'✓' if cors_ok else '✗'} CORS Configuration")
    print(f"{'✓' if token else '✗'} Authentication")
    print(f"{'✓' if dashboard_ok else '✗'} Dashboard Endpoint")
    print("=" * 60)
    
    if cors_ok and token and dashboard_ok:
        print("✓ ALL TESTS PASSED!")
    else:
        print("✗ SOME TESTS FAILED - Check output above")


if __name__ == "__main__":
    main()