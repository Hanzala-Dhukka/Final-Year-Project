import asyncio
import os
import sys

# Add the current directory to sys.path to allow imports from 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.services.monitoring_jobs import monitor_targets
from app.database.db import database

async def test_monitoring_job():
    print("Starting Monitoring Job Test...")
    
    # 1. Ensure at least one enabled target exists for testing
    print("Checking for enabled targets...")
    test_target = {
        "type": "github",
        "target": "facebook/react",
        "enabled": True
    }
    
    # Insert if not exists
    await database["monitoring_targets"].update_one(
        {"target": test_target["target"]},
        {"$set": test_target},
        upsert=True
    )
    
    try:
        # 2. Run the monitoring job
        print("Running monitor_targets()...")
        await monitor_targets()
        print("monitor_targets() executed.")
        
        # 3. Verify that an alert was created
        print("Verifying alert creation in MongoDB...")
        alert = await database["security_alerts"].find_one(
            {"target": test_target["target"], "title": "Scheduled Scan Completed"}
        )
        
        if alert:
            print("Success! Scheduled scan alert found:")
            print(f"   Target: {alert['target']}")
            print(f"   Severity: {alert['severity']}")
            print(f"   Created At: {alert['created_at']}")
        else:
            print("Failure: Alert not found in MongoDB.")
            
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(test_monitoring_job())
