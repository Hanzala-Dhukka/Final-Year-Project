from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from app.services.threat_model_service import threat_results_store
from app.services.pdf_generator import generate_pdf, get_pdf_path
from app.dependencies.auth import get_current_user
from app.database.db import database
import os

router = APIRouter()


@router.get("/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):
    """List security reports for the current user (or all for admins)"""
    reports_collection = database["security_reports"]

    query = {}
    if current_user.get("role") != "admin":
        query = {"user_id": current_user["_id"]}

    reports = await reports_collection.find(query).sort("created_at", -1).to_list(length=100)

    result = []
    for report in reports:
        report["_id"] = str(report["_id"])
        if "user_id" in report:
            report["user_id"] = str(report["user_id"])
        result.append({
            "id": report["_id"],
            "title": report.get("title", "Untitled Report"),
            "risk": report.get("risk_level", "Unknown"),
            "created": report.get("created_at"),
        })

    return result


@router.get("/report/{project_id}")
async def download_report(project_id: str):
    """
    Download PDF report for a project
    
    Args:
        project_id: Unique project identifier
        
    Returns:
        PDF file as download
    """
    # Get project data
    project_data = threat_results_store.get(project_id)
    
    if not project_data:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if PDF already exists
    pdf_path = get_pdf_path(project_id, project_data.get("project", "report"))
    
    if not os.path.exists(pdf_path):
        # Generate PDF
        pdf_path = generate_pdf(project_id, project_data)
    
    return FileResponse(
        path=pdf_path,
        filename=f"{project_data.get('project', 'report')}_Threat_Report.pdf",
        media_type="application/pdf"
    )


@router.get("/report/{project_id}/preview")
async def preview_report(project_id: str):
    """
    Preview PDF report in browser
    
    Args:
        project_id: Unique project identifier
        
    Returns:
        PDF file for preview
    """
    # Get project data
    project_data = threat_results_store.get(project_id)
    
    if not project_data:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if PDF already exists
    pdf_path = get_pdf_path(project_id, project_data.get("project", "report"))
    
    if not os.path.exists(pdf_path):
        # Generate PDF
        pdf_path = generate_pdf(project_id, project_data)
    
    return FileResponse(
        path=pdf_path,
        filename=f"{project_data.get('project', 'report')}_Threat_Report.pdf",
        media_type="application/pdf",
        headers={"Content-Disposition": "inline"}
    )