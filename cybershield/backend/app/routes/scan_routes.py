from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
import random
import requests

from app.database.db import database
from app.dependencies.auth import get_current_user

router = APIRouter()
scans_collection = database["scans"]


class ScanRequest(BaseModel):
    target_url: str
    scan_type: str  # e.g., "port_scan", "vulnerability_scan", "full_scan"


@router.post("/start")
async def start_scan(
    scan_req: ScanRequest,
    current_user: dict = Depends(get_current_user)
):
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
        "user_id": current_user["_id"],
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


@router.get("/history")
async def get_scan_history(current_user: dict = Depends(get_current_user)):
    
    # Admin sees all, user sees own
    query = {}
    if current_user.get("role") != "admin":
        query = {"user_id": current_user["_id"]}

    cursor = scans_collection.find(query).sort("created_at", -1)
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
        "scans": scans
    }
