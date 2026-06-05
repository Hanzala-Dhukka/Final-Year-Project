from app.database.db import database 
from app.services.alert_service import ( 
    create_alert 
) 
from app.services.risk_engine import calculate_risk_score
import random

async def monitor_targets(): 
    print("Starting scheduled monitoring scan...")
    targets = await database[ 
        "monitoring_targets" 
    ].find({ 
        "enabled": True 
    }).to_list(100) 

    for target in targets: 
        print(f"Scanning target: {target['target']}")
        
        # 1. Get previous risk score (default to 100)
        previous_score = target.get("last_score", 100)
        
        # 2. Simulate actual scanner results
        # In a real scenario, this would call github_scanner or other services
        mock_findings = []
        possible_issues = [
            {"severity": "Critical"}, {"severity": "High"}, 
            {"severity": "Medium"}, {"severity": "Low"}
        ]
        
        # Randomly decide if we found issues this time
        if random.random() > 0.5:
            num_issues = random.randint(1, 5)
            # Create a structure that calculate_risk_score expects: list of findings, each with issues
            mock_findings = [{"issues": [random.choice(possible_issues) for _ in range(num_issues)]}]
        
        # 3. Calculate current risk score
        current_score = calculate_risk_score(mock_findings)
        
        print(f"Target: {target['target']} | Prev Score: {previous_score} | Current Score: {current_score}")

        # 4. Check for significant drop in security (difference > 20)
        if (previous_score - current_score) > 20:
            print(f"⚠️ Significant risk drop detected for {target['target']}!")
            await create_alert( 
                "Critical Security Regression Detected", 
                "Critical", 
                target["target"] 
            )
        else:
            # Normal scan completion alert
            await create_alert( 
                "Scheduled Scan Completed", 
                "Medium", 
                target["target"] 
            )

        # 5. Update target with the new score for next comparison
        await database["monitoring_targets"].update_one(
            {"_id": target["_id"]},
            {"$set": {"last_score": current_score}}
        )

    print(f"Scheduled scan completed for {len(targets)} targets.")
