from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_dashboard_c2_endpoints():
    print("Testing GET /dashboard/overview ...")
    response = client.get("/dashboard/overview")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    print("GET /dashboard/overview response keys:", list(data.keys()))

    # Verify required fields
    assert "user_id" in data
    assert "security_score" in data
    assert "projects" in data
    assert "scans" in data
    assert "weekly_scans" in data
    assert len(data["weekly_scans"]) >= 7
    assert "vulnerability_trend" in data
    assert len(data["vulnerability_trend"]) >= 7
    assert "xp" in data
    assert "rank" in data
    assert "achievements" in data

    print("Testing WebSocket /ws/dashboard ...")
    with client.websocket_connect("/ws/dashboard") as websocket:
        msg = websocket.receive_json()
        print("WebSocket initial msg:", msg)
        assert msg["event"] == "connected"

        websocket.send_text("ping")
        resp = websocket.receive_json()
        print("WebSocket response:", resp)
        assert resp["event"] == "pong"

    print("ALL MODULE C2 BACKEND ENDPOINT & WEBSOCKET TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_dashboard_c2_endpoints()
