"""
Report Routes — Module D5

FastAPI router for the CyberShield Professional Security Reporting System.
Mounted under /api/v1/reports.
"""

import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr

from app.dependencies.auth import get_current_user
from app.database.db import database
from app.reports.report_service import (
    get_report_for_scan,
    get_report_by_id,
    get_report_by_scan_id,
    get_report_history,
    get_score_history,
    compare_scans,
    generate_ai_executive_summary,
    delete_report,
)
from app.reports.email_service import send_report_email
from app.reports.pdf_generator import generate_report_pdf
from app.reports.csv_generator import generate_report_csv
from app.reports.json_generator import generate_report_json
from app.reports.charts import get_severity_pie_data, get_comparison_bar_data

router = APIRouter()

# Reports output directory (sibling to backend/)
_OUTPUT_DIR = os.path.join(
    os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ),
    "reports_output",
)


def _ensure_output_dir() -> str:
    """Create and return the reports output directory."""
    os.makedirs(_OUTPUT_DIR, exist_ok=True)
    return _OUTPUT_DIR


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class EmailReportRequest(BaseModel):
    email: EmailStr


class CompareRequest(BaseModel):
    old_scan_id: str
    new_scan_id: str


# ---------------------------------------------------------------------------
# 1. POST /generate/{scan_id}
# ---------------------------------------------------------------------------

@router.post("/generate/{scan_id}")
async def generate_report(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Generate a security report from an existing scan."""
    try:
        report_data = await get_report_for_scan(scan_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")

    # Attach user info for ownership
    await database["reports"].update_one(
        {"scan_id": scan_id},
        {"$set": {"user_id": current_user["_id"]}},
    )

    return {
        "message": "Report generated successfully",
        "report": report_data,
    }


# ---------------------------------------------------------------------------
# 2. GET /history  (MUST be before /{report_id} to avoid param capture)
# ---------------------------------------------------------------------------

@router.get("/history")
async def report_history(
    limit: int = Query(default=50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
):
    """Get paginated report history for the current user."""
    reports = await get_report_history(user_id=current_user["_id"], limit=limit)
    return {"reports": reports, "count": len(reports)}


# ---------------------------------------------------------------------------
# 3. GET /by-scan/{scan_id}  (MUST be before /{report_id})
# ---------------------------------------------------------------------------

@router.get("/by-scan/{scan_id}")
async def get_report_by_scan(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Retrieve a report by its associated scan_id."""
    report = await get_report_by_scan_id(scan_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found for this scan")
    return {"report": report}


# ---------------------------------------------------------------------------
# 4. GET /score-history/{repository}  (MUST be before /{report_id})
# ---------------------------------------------------------------------------

@router.get("/score-history/{repository}")
async def score_history(
    repository: str,
    limit: int = Query(default=30, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
):
    """Get security score trend for a repository."""
    history = await get_score_history(repository, limit=limit)
    return {"repository": repository, "history": history}


# ---------------------------------------------------------------------------
# 5. GET /chart-data/{report_id}  (MUST be before /{report_id})
# ---------------------------------------------------------------------------

@router.get("/chart-data/{report_id}")
async def chart_data(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get pie and bar chart data for the report's vulnerabilities."""
    report = await get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    pie_data = get_severity_pie_data(report)

    return {
        "report_id": report_id,
        "severity_pie": pie_data,
    }


# ---------------------------------------------------------------------------
# 6. GET /{report_id}  (MUST be LAST among GET routes)
# ---------------------------------------------------------------------------

@router.get("/{report_id}")
async def get_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Retrieve a full report by its unique report_id."""
    report = await get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"report": report}


# ---------------------------------------------------------------------------
# 5. GET /download/pdf/{report_id}
# ---------------------------------------------------------------------------

@router.get("/download/pdf/{report_id}")
async def download_pdf(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Generate and download a PDF version of the report."""
    report = await get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    out_dir = _ensure_output_dir()
    pdf_path = os.path.join(out_dir, f"{report_id}.pdf")

    try:
        generate_report_pdf(report, pdf_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")

    if not os.path.isfile(pdf_path):
        raise HTTPException(status_code=500, detail="PDF file was not created")

    return FileResponse(
        path=pdf_path,
        filename=f"CyberShield_{report.get('repository', 'report')}_{report_id}.pdf",
        media_type="application/pdf",
    )


# ---------------------------------------------------------------------------
# 6. GET /download/json/{report_id}
# ---------------------------------------------------------------------------

@router.get("/download/json/{report_id}")
async def download_json(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Generate and download a JSON version of the report."""
    report = await get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    out_dir = _ensure_output_dir()
    json_path = os.path.join(out_dir, f"{report_id}.json")

    try:
        generate_report_json(report, json_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JSON generation failed: {e}")

    if not os.path.isfile(json_path):
        raise HTTPException(status_code=500, detail="JSON file was not created")

    return FileResponse(
        path=json_path,
        filename=f"CyberShield_{report.get('repository', 'report')}_{report_id}.json",
        media_type="application/json",
    )


# ---------------------------------------------------------------------------
# 7. GET /download/csv/{report_id}
# ---------------------------------------------------------------------------

@router.get("/download/csv/{report_id}")
async def download_csv(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Generate and download a CSV version of the report."""
    report = await get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    out_dir = _ensure_output_dir()
    csv_path = os.path.join(out_dir, f"{report_id}.csv")

    try:
        generate_report_csv(report, csv_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV generation failed: {e}")

    if not os.path.isfile(csv_path):
        raise HTTPException(status_code=500, detail="CSV file was not created")

    return FileResponse(
        path=csv_path,
        filename=f"CyberShield_{report.get('repository', 'report')}_{report_id}.csv",
        media_type="text/csv",
    )


# ---------------------------------------------------------------------------
# 8. POST /email/{report_id}
# ---------------------------------------------------------------------------

@router.post("/email/{report_id}")
async def email_report(
    report_id: str,
    body: EmailReportRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate a PDF and email the report to the specified address."""
    report = await get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Generate PDF for attachment
    out_dir = _ensure_output_dir()
    pdf_path = os.path.join(out_dir, f"{report_id}.pdf")

    try:
        generate_report_pdf(report, pdf_path)
    except Exception:
        pdf_path = None  # Send without attachment if PDF fails

    success = await send_report_email(
        to_email=body.email,
        report_data=report,
        pdf_path=pdf_path,
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send report email")

    # Record that the report was emailed
    await database["reports"].update_one(
        {"report_id": report_id},
        {
            "$set": {
                "emailed_to": body.email,
                "emailed_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    return {"message": f"Report emailed to {body.email}"}


# ---------------------------------------------------------------------------
# 9. POST /compare
# ---------------------------------------------------------------------------

@router.post("/compare")
async def compare_two_scans(
    body: CompareRequest,
    current_user: dict = Depends(get_current_user),
):
    """Compare two scan reports and return improvement/regression metrics."""
    try:
        result = await compare_scans(body.old_scan_id, body.new_scan_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {e}")

    return result


# ---------------------------------------------------------------------------
# 10. POST /ai-summary/{scan_id}
# ---------------------------------------------------------------------------

@router.post("/ai-summary/{scan_id}")
async def ai_summary(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Generate an AI executive summary for a scan's report."""
    report = await get_report_by_scan_id(scan_id)
    if not report:
        # Try building the report first
        try:
            report = await get_report_for_scan(scan_id)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

    summary = await generate_ai_executive_summary(report)

    # Persist the summary back to the report
    await database["reports"].update_one(
        {"scan_id": scan_id},
        {"$set": {"ai_executive_summary": summary}},
    )

    return {"scan_id": scan_id, "executive_summary": summary}


# ---------------------------------------------------------------------------
# 11. DELETE /{report_id}
# ---------------------------------------------------------------------------

@router.delete("/{report_id}")
async def delete_report_endpoint(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a report by its report_id."""
    deleted = await delete_report(report_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Report not found or already deleted")
    return {"message": "Report deleted successfully", "report_id": report_id}
