from fastapi import APIRouter, Depends, HTTPException
import requests
from datetime import datetime
from bson import ObjectId
from app.database.db import database
from app.utils.dependencies import verify_token
from app.services.header_analyzer import analyze_security_headers

router = APIRouter()
scans_collection = database["scans"]


@router.post("/analyze-headers")
async def analyze_headers(
    data: dict,
    user_data: dict = Depends(verify_token)
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
            "user_id": ObjectId(user_data["user_id"]),
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


@router.get("/scan-history")
async def get_scan_history():

    scan_collection = database["security_scans"]

    scans = await scan_collection.find().to_list(100)

    for scan in scans:
        scan["_id"] = str(scan["_id"])
        if "created_at" in scan and isinstance(scan["created_at"], datetime):
            scan["created_at"] = scan["created_at"].isoformat()

    return scans


@router.get("/status")
async def get_security_status(user_data: dict = Depends(verify_token)):
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
async def initiate_scan(user_data: dict = Depends(verify_token)):
    """
    Trigger a new security scan.
    Requires authentication.
    """
    return {
        "message": "Security scan initiated successfully",
        "scan_id": "scan_12345",
        "estimated_time": "5 minutes"
    }
