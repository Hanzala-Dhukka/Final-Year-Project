
#!/usr/bin/env python3
import sys
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_repo_scan(repo_url, test_name):
    print(f"\n{'='*80}")
    print(f"TESTING: {test_name}")
    print(f"URL: {repo_url}")
    print('='*80)
    
    try:
        # First get a token (we'll use a test user or just test the scan endpoint logic)
        # For testing, we can call /github/scan-repository (note: we need a valid auth token for authenticated routes)
        # Wait let's check the routes - looking at github_routes.py, the endpoints are under /api/v1/github
        scan_url = f"{BASE_URL}/api/v1/github/scan-repository"
        
        # First let's get a token via login (we need to create a test user)
        # Let's call auth login first
        login_url = f"{BASE_URL}/api/v1/auth/login"
        
        # Try to login with a test user, if fails, create one
        try:
            login_data = {"username": "testuser", "password": "testpass"}
            r = requests.post(login_url, json=login_data)
            if r.status_code == 200:
                token = r.json()["access_token"]
            else:
                # If user doesn't exist, register first
                register_url = f"{BASE_URL}/api/v1/auth/register"
                register_data = {"username": "testuser", "email": "test@test.com", "password": "testpass"}
                requests.post(register_url, json=register_data)
                r = requests.post(login_url, json=login_data)
                token = r.json()["access_token"]
        except Exception as e:
            print(f"Warning: Couldn't get auth token, testing without auth (may fail): {e}")
            token = None
        
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        
        # Call scan endpoint
        scan_data = {"repo_url": repo_url}
        print(f"\nCalling {scan_url} ...")
        r = requests.post(scan_url, json=scan_data, headers=headers, timeout=300)
        
        if r.status_code == 200:
            data = r.json()
            print("\n✅ SUCCESS! Scan returned 200")
            
            # Verify required fields
            print("\nVerifying scan response fields:")
            required_fields = [
                "repository_info", "technologies", "dependency_report",
                "secret_summary", "severity_summary", "category_summary",
                "distribution", "repository_health", "risk_dashboard",
                "score_card", "top_risks", "recommendations",
                "executive_summary"
            ]
            for field in required_fields:
                if field in data:
                    print(f"  ✅ {field} present")
                else:
                    print(f"  ❌ {field} missing!")
            
            # Print summary
            print("\n📊 Quick summary:")
            rd = data.get("risk_dashboard", {})
            if rd:
                print(f"  Risk Score: {rd.get('risk_score')}")
                print(f"  Security Grade: {rd.get('security_grade')}")
                print(f"  Files Scanned: {rd.get('files_scanned')}")
            
            ss = data.get("severity_summary", {})
            if ss:
                print(f"  Severity Summary: Critical {ss.get('critical')}, High {ss.get('high')}, Medium {ss.get('medium')}, Low {ss.get('low')}")
            
            sc = data.get("score_card", {})
            if sc:
                print("  Score Card:")
                for k, v in sc.items():
                    print(f"    {k}: {v}")
            
            return data
        else:
            print(f"\n❌ Failed! Status: {r.status_code}")
            print(r.text)
            return None
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    print("="*80)
    print("CYBERSHIELD TEST SUITE")
    print("="*80)
    
    # Test repos from user request
    test_repos = [
        ("https://github.com/your-cybershield-repo/this-repo", "CyberShield Repository"),
        ("https://github.com/WebGoat/WebGoat", "OWASP WebGoat"),
        ("https://github.com/digininja/DVWA", "DVWA"),
        ("https://github.com/juice-shop/juice-shop", "OWASP Juice Shop"),
        ("https://github.com/facebook/react", "React Project")
    ]
    
    results = {}
    
    for url, name in test_repos:
        results[name] = test_repo_scan(url, name)
    
    print("\n" + "="*80)
    print("TEST RUN COMPLETE")
    print("="*80)
    print("\nResults:")
    for name, data in results.items():
        status = "✅ PASS" if data else "❌ FAIL"
        print(f"  {name}: {status}")
