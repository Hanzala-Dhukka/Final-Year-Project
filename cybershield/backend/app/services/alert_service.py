from datetime import datetime 
from app.database.db import database 

async def create_alert( 
    title, 
    severity, 
    target 
): 

    await database[ 
        "security_alerts" 
    ].insert_one({ 

        "title": title, 

        "severity": severity, 

        "target": target, 

        "created_at": datetime.utcnow() 
    })
