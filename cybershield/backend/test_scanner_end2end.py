import requests
import random
import string

BASE_URL = "http://localhost:8000/api/v1"

def random_string(length=8):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))

def run_tests():
    # 1. Register a dummy user
    username = f"test_{random_string()}"
    email = f"{username}@example.com"
    password = "testpassword123"
    
    register_data = {
        "username": username,
        "email": email,
        "password": password,
        "role": "user"
    }
    
    print("Registering test user...")
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json=register_data, timeout=10)
    print("Register response:", reg_resp.status_code, reg_resp.json())
    
    # 2. Login
    login_data = {"email": email, "password": password}
    print("Logging in...")
    login_resp = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
    print("Login response:", login_resp.status_code)
    token = login_resp.json().get("access_token")
    
    if not token:
        print("ERROR: Did not receive auth token")
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Test Invalid URL (Should return 400)
    print("\n--- Test case 1: Invalid URL (Expected 400) ---")
    data_invalid = {"repo_url": "https://github.com/invalid_url_no_parts"}
    resp = requests.post(f"{BASE_URL}/github/scan-repository", json=data_invalid, headers=headers, timeout=120)
    print("Status:", resp.status_code)
    print("JSON:", resp.json())
    
    # 4. Test Repository Not Found (Should return 404)
    print("\n--- Test case 2: Repository Not Found (Expected 404) ---")
    data_missing = {"repo_url": "https://github.com/OWASP/WebGoat-NonExistent-Repo-12345"}
    resp = requests.post(f"{BASE_URL}/github/scan-repository", json=data_missing, headers=headers, timeout=120)
    print("Status:", resp.status_code)
    print("JSON:", resp.json())
    
    # 5. Test Valid Repository (Should return 200 and combined dict)
    print("\n--- Test case 3: Valid Repository (Expected 200 with combined fields) ---")
    data_valid = {"repo_url": "https://github.com/Hanzala-Dhukka/Final-Year-Project"}
    resp = requests.post(f"{BASE_URL}/github/scan-repository", json=data_valid, headers=headers, timeout=120)
    print("Status:", resp.status_code)
    if resp.status_code == 200:
        res_data = resp.json()
        print("Success! Keys in response:")
        for k in res_data.keys():
            print(f"  - {k}")
        print("\nRepository Info snippet:")
        print(res_data.get("repository_info"))
        print("\nScan Summary snippet:")
        print(res_data.get("scan_summary"))
    else:
        print("JSON on failure:", resp.json())

if __name__ == "__main__":
    run_tests()
