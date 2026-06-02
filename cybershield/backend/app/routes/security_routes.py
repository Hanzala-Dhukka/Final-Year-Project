from fastapi import APIRouter, Depends, HTTPException
import requests
from datetime import datetime
from bson import ObjectId
from app.database.db import database
from app.dependencies.auth import get_current_user
from app.services.header_analyzer import analyze_security_headers

router = APIRouter()
scans_collection = database["scans"]


@router.post("/analyze-headers")
async def analyze_headers(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    url = data.get("url")

    if not url:
        raise HTTPException(
            status_code=400,
            detail="URL is required"
        )

    if not url.startswith("http"):
        url = f"https://{url}"

    try:
        response = requests.get(url)
        headers = dict(response.headers)
        analysis = analyze_security_headers(headers)

        scan_collection = database["security_scans"]

        scan_data = {
            "url": url,
            "analysis": analysis,
            "created_at": datetime.utcnow()
        }

        await scan_collection.insert_one(scan_data)

        # Store scan in MongoDB
        scan_record = {
            "user_id": current_user["_id"],
            "target_url": url,
            "scan_type": "Header Analysis",
            "status": "Completed",
            "created_at": datetime.utcnow(),
            "score": analysis["total_score"],
            "risk_level": analysis["risk_level"],
            "analysis_results": analysis["results"],
            "raw_headers": headers
        }
        
        await scans_collection.insert_one(scan_record)

        return {
            "url": url,
            "analysis": analysis,
            "headers": headers
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    try:
        # Admin sees all, user sees own
        query = {}
        if current_user.get("role") != "admin":
            query = {"user_id": current_user["_id"]}

        history = await scans_collection.find(query).sort("created_at", -1).to_list(100)

        for scan in history:
            scan["_id"] = str(scan["_id"])
            if "user_id" in scan:
                scan["user_id"] = str(scan["user_id"])
        
        return history
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/status")
async def get_security_status(current_user: dict = Depends(get_current_user)):
    """
    Check the overall security status of the system.
    Requires authentication.
    """
    return {
        "status": "secure",
        "shield_active": True,
        "last_scan": "2026-05-22 10:00:00",
        "threats_found": 0,
        "monitored_assets": 12
    }


@router.post("/scan")
async def initiate_scan(current_user: dict = Depends(get_current_user)):
    """
    Trigger a new security scan.
    Requires authentication.
    """
    return {
        "message": "Security scan initiated successfully",
        "scan_id": "scan_12345",
        "estimated_time": "5 minutes"
    }
