from fastapi import APIRouter 
from app.database.db import database 
from datetime import datetime 

router = APIRouter() 

@router.post("/targets") 
async def add_target(data: dict): 
    target = { 
        "type": data["type"], 
        "target": data["target"], 
        "enabled": True, 
        "created_at": datetime.utcnow() 
    } 

    result = await database[ 
        "monitoring_targets" 
    ].insert_one(target) 

    return { 
        "id": str(result.inserted_id) 
    } 

@router.get("/alerts") 
async def get_alerts(): 
    alerts = await database[ 
        "security_alerts" 
    ].find().sort( 
        "created_at", 
        -1 
    ).to_list(100) 

    for alert in alerts: 
        alert["_id"] = str( 
            alert["_id"] 
        ) 

    return alerts
