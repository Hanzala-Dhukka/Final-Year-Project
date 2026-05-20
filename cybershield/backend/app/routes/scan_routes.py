from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
import random

from app.database.db import database

router = APIRouter()
scans_collection = database["scans"]


class ScanRequest(BaseModel):
    user_id: str
    target_url: str
    scan_type: str  # e.g., "port_scan", "vulnerability_scan", "full_scan"


@router.post("/start")
async def start_scan(scan_req: ScanRequest):
    if not ObjectId.is_valid(scan_req.user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )

    # Simple mock vulnerability findings based on target url
    findings = [
        {"issue": "SQL Injection vulnerability found in login parameter", "severity": "High"},
        {"issue": "XSS vulnerability detected in profile page query", "severity": "Medium"},
        {"issue": "Outdated TLS version 1.1 in use", "severity": "Low"},
        {"issue": "Missing HTTP Security Headers (HSTS, CSP)", "severity": "Low"},
    ]

    # Select random subsets of mock issues
    detected_issues = random.sample(findings, k=random.randint(1, len(findings)))

    new_scan = {
        "user_id": ObjectId(scan_req.user_id),
        "target_url": scan_req.target_url,
        "scan_type": scan_req.scan_type,
        "status": "Completed",
        "created_at": datetime.utcnow(),
        "issues_found": len(detected_issues),
        "findings": detected_issues
    }

    result = await scans_collection.insert_one(new_scan)

    return {
        "message": "Scan completed successfully",
        "scan_id": str(result.inserted_id),
        "target_url": scan_req.target_url,
        "issues_count": len(detected_issues),
        "findings": detected_issues
    }


@router.get("/history/{user_id}")
async def get_scan_history(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )

    cursor = scans_collection.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
    scans = []

    async for scan in cursor:
        scans.append({
            "id": str(scan["_id"]),
            "target_url": scan.get("target_url"),
            "scan_type": scan.get("scan_type"),
            "status": scan.get("status"),
            "created_at": scan.get("created_at"),
            "issues_found": scan.get("issues_found", 0),
            "findings": scan.get("findings", [])
        })

    return {
        "user_id": user_id,
        "scans": scans
    }
