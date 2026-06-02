from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from datetime import datetime
from bson import ObjectId
from app.database.db import database
from app.models.report_model import ReportCreate, ReportResponse
from app.dependencies.auth import get_current_user
from app.services.pdf_generator import generate_pdf_report

router = APIRouter()
reports_collection = database["security_reports"]

@router.post("/save-report")
async def save_report(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    # Accept both 'report_data' or 'report' for flexibility
    report_data = data.get("report_data") or data.get("report")
    report_type = data.get("report_type", "security_scan")
    title = data.get("title", "Security Report")
    
    if not report_data:
        raise HTTPException(
            status_code=400,
            detail="Report data is required"
        )
    
    report_document = {
        "user_id": current_user["_id"],
        "report_data": report_data,
        "title": title,
        "risk_level": report_data.get("risk_level", "Unknown"),
        "summary": report_data.get("summary", ""),
        "report_type": report_type,
        "created_at": datetime.utcnow()
    }
    
    result = await reports_collection.insert_one(report_document)
    
    return {
        "message": "Report saved successfully",
        "report_id": str(result.inserted_id)
    }

@router.get("/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):

    reports_collection = database[
        "security_reports"
    ]

    # Admin sees all reports, regular users see only their own
    query = {}
    if current_user.get("role") != "admin":
        query = {"user_id": current_user["_id"]}

    reports = await reports_collection.find(query).sort(
        "created_at",
        -1
    ).to_list(100)

    for report in reports:
        report["_id"] = str(
            report["_id"]
        )
        if "user_id" in report:
            report["user_id"] = str(report["user_id"])

    return reports

@router.get("/reports/{report_id}")
async def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(report_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid report ID"
        )
    
    query = {"_id": ObjectId(report_id)}
    # If not admin, must be the owner
    if current_user.get("role") != "admin":
        query["user_id"] = current_user["_id"]

    report = await reports_collection.find_one(query)
    
    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )
    
    report["_id"] = str(report["_id"])
    report["user_id"] = str(report["user_id"])
    
    return report

@router.post("/generate-and-save-report")
async def generate_and_save_report(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    report = data.get("report")
    title = data.get("title", "Security Report")
    
    if not report:
        raise HTTPException(
            status_code=400,
            detail="Report data required"
        )
    
    report_document = {
        "user_id": current_user["_id"],
        "report_data": report,
        "title": title,
        "risk_level": report.get("risk_level", "Unknown"),
        "summary": report.get("summary", ""),
        "report_type": data.get("report_type", "security_scan"),
        "created_at": datetime.utcnow()
    }
    
    result = await reports_collection.insert_one(report_document)
    
    output_path = "security_report.pdf"
    generate_pdf_report(report, output_path)
    
    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename=f"{title.replace(' ', '_')}_Report.pdf"
    )