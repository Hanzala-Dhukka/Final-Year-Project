from app.database.db import database 
from app.services.alert_service import ( 
    create_alert 
) 
from app.services.error_log_service import with_error_logging 

@with_error_logging(extra_info={"job": "scheduled_monitoring"})
async def monitor_targets(): 
    print("Starting scheduled monitoring scan...")
    targets = await database[ 
        "monitoring_targets" 
    ].find({ 
        "enabled": True 
    }).to_list(100) 

    for target in targets: 
        # later call actual scanners 
        print(f"Scanning target: {target['target']}")
        await create_alert( 
            "Scheduled Scan Completed", 
            "Medium", 
            target["target"] 
        )
    print(f"Scheduled scan completed for {len(targets)} targets.")
