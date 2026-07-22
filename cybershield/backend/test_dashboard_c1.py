from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_dashboard_endpoints():
    print("Testing GET /dashboard ...")
    r1 = client.get("/dashboard")
    assert r1.status_code == 200, f"Expected 200, got {r1.status_code}: {r1.text}"
    data1 = r1.json()
    print("GET /dashboard response:", data1)
    assert data1["username"] == "Hanzala"
    assert data1["security_score"] == 85
    assert data1["projects"] == 12
    assert data1["scans"] == 45
    assert data1["critical"] == 3
    assert data1["high"] == 7
    assert data1["medium"] == 12
    assert data1["low"] == 20
    assert len(data1["recent_activity"]) == 2

    print("Testing GET /api/dashboard ...")
    r2 = client.get("/api/dashboard")
    assert r2.status_code == 200, f"Expected 200, got {r2.status_code}: {r2.text}"
    data2 = r2.json()
    assert data2["username"] == "Hanzala"

    print("Testing GET /api/v1/dashboard ...")
    r3 = client.get("/api/v1/dashboard")
    assert r3.status_code == 200, f"Expected 200, got {r3.status_code}: {r3.text}"

    print("ALL DASHBOARD ENDPOINT TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_dashboard_endpoints()
