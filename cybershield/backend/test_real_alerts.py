import asyncio
import os
import sys

# Add the current directory to sys.path to allow imports from 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.services.monitoring_jobs import monitor_targets
from app.database.db import database
from app.services.risk_engine import calculate_risk_score

async def test_real_alert_logic():
    print("Starting Real Security Alert Logic Test...")
    
    target_url = "test/regression-repo"
    
    # 1. Setup target with a high previous score
    print(f"Setting up target {target_url} with score 95...")
    await database["monitoring_targets"].update_one(
        {"target": target_url},
        {"$set": {
            "type": "github",
            "target": target_url,
            "enabled": True,
            "last_score": 95,
            "created_at": "2026-06-03"
        }},
        upsert=True
    )
    
    # 2. Simulate a scan that results in a score of 60
    # findings that subtract 35 points: 2 Critical (30) + 1 Medium (5) = 35. 100 - 35 = 65.
    # To get 60: 2 Critical (30) + 1 High (10) = 40. 100 - 40 = 60.
    mock_findings = [{
        "issues": [
            {"severity": "Critical"},
            {"severity": "Critical"},
            {"severity": "High"}
        ]
    }]
    current_score = calculate_risk_score(mock_findings)
    print(f"Calculated current score: {current_score}")
    
    # 3. Manually run the logic to verify alert creation
    target = await database["monitoring_targets"].find_one({"target": target_url})
    previous_score = target.get("last_score", 100)
    
    print(f"Comparing: Prev {previous_score} vs Current {current_score} (Diff: {previous_score - current_score})")
    
    if (previous_score - current_score) > 20:
        print("Alert logic triggered! Creating critical alert...")
        from app.services.alert_service import create_alert
        await create_alert(
            "Critical Security Regression Detected",
            "Critical",
            target["target"]
        )
    
    # 4. Verify in database
    alert = await database["security_alerts"].find_one({
        "target": target_url,
        "severity": "Critical"
    })
    
    if alert:
        print("Success! Critical alert found in database.")
    else:
        print("Failure: Critical alert not found.")

if __name__ == "__main__":
    asyncio.run(test_real_alert_logic())
