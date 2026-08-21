"""
Gamification API routes (Module 7.5).

Spec Step 11 endpoints:
  GET   /progress                       Current user's XP/level/streak/summary
  GET   /leaderboard                    Global XP leaderboard
  GET   /achievements                   Achievements (locked/unlocked)
  GET   /badges                         Badges (locked/unlocked)
  GET   /certificates                   User's certificates
  GET   /certificate/{id}/download      Download a certificate PDF
  GET   /activity                       Activity timeline
  GET   /goals                          Learning goals
  POST  /goals                          Create a learning goal
"""
import os
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response

from app.dependencies.auth import get_current_user
from app.schemas.achievement_schema import (
    ProgressResponse,
    AchievementOut,
    BadgeOut,
    CertificateOut,
    LeaderboardEntry,
    ActivityOut,
    LearningGoalRequest,
    LearningGoalOut,
)
from app.services import gamification_service
from app.services.learning_goal_service import (
    list_goals,
    create_goal,
    delete_goal,
)
from app.models.gamification import learning_goal_document
from app.database.db import database
from app.services.error_log_service import fire_and_forget_log

router = APIRouter(
    prefix="/api/v1/gamification",
    tags=["Gamification (Module 7.5)"],
)


@router.get("/progress", response_model=ProgressResponse)
async def progress(user=Depends(get_current_user)):
    return await gamification_service.get_progress(str(user["_id"]))


@router.get("/leaderboard", response_model=dict)
async def leaderboard(limit: int = Query(20, le=100)):
    entries = await gamification_service.get_leaderboard_entries(limit=limit)
    return {"leaderboard": entries, "count": len(entries)}


@router.get("/achievements", response_model=list)
async def achievements(user=Depends(get_current_user)):
    return await gamification_service.get_achievements(str(user["_id"]))


@router.get("/badges", response_model=list)
async def badges(user=Depends(get_current_user)):
    return await gamification_service.get_badges(str(user["_id"]))


@router.get("/certificates", response_model=list)
async def certificates(user=Depends(get_current_user)):
    return await gamification_service.get_certificates(str(user["_id"]))


@router.get("/activity", response_model=list)
async def activity(user=Depends(get_current_user), limit: int = Query(30, le=100)):
    return await gamification_service.get_activity(str(user["_id"]), limit=limit)


@router.get("/goals", response_model=list)
async def goals(user=Depends(get_current_user)):
    return await list_goals(str(user["_id"]))


@router.post("/goals", response_model=LearningGoalOut)
async def create_goal_route(payload: LearningGoalRequest, user=Depends(get_current_user)):
    return await create_goal(str(user["_id"]), payload)


@router.delete("/goals/{goal_id}", response_model=dict)
async def delete_goal_route(goal_id: str, user=Depends(get_current_user)):
    """Delete one of the user's learning goals."""
    deleted = await delete_goal(str(user["_id"]), goal_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"deleted": True, "id": goal_id}


@router.get("/certificate/{certificate_id}/download")
async def download_certificate(certificate_id: str, user=Depends(get_current_user)):
    """Download a certificate PDF by its certificate_id (stored in file_path)."""
    from bson import ObjectId

    # Try MongoDB lookup first
    try:
        cert = await database["certificates"].find_one({"_id": ObjectId(certificate_id)})
    except Exception:
        fire_and_forget_log()
        cert = None

    # Fallback: try by certificate_id field
    if not cert:
        try:
            cert = await database["certificates"].find_one({"certificate_id": certificate_id})
        except Exception:
            fire_and_forget_log()
            cert = None

    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    if str(cert.get("user_id")) != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Forbidden")

    # Serve the PDF file from file_path
    file_path = cert.get("file_path", "")
    if file_path and os.path.exists(file_path):
        with open(file_path, "rb") as f:
            pdf_bytes = f.read()
        filename = f"certificate_{certificate_id}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    # Fallback: generate PDF on-the-fly from stored data
    pdf = _build_cert_pdf(cert)
    filename = f"certificate_{certificate_id}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/certificates/all")
async def all_certificates(user=Depends(get_current_user)):
    """Get all certificates for the current user (category + professional)."""
    from app.services.certificate_service import CertificateService
    certs = CertificateService.get_user_certificates(str(user["_id"]))
    return {"certificates": certs}


@router.get("/certificate/category/{vulnerability_type}/check")
async def check_category_cert(vulnerability_type: str, user=Depends(get_current_user)):
    """Check if user has completed all labs for a vulnerability category."""
    from app.services.certificate_service import CertificateService
    result = CertificateService.check_category_completion(
        str(user["_id"]), vulnerability_type
    )
    return result


@router.post("/certificate/category/{vulnerability_type}/generate")
async def generate_category_cert(vulnerability_type: str, user=Depends(get_current_user)):
    """Generate a certificate for completing all labs of a category."""
    from app.services.certificate_service import CertificateService

    user_id = str(user["_id"])
    user_name = user.get("name") or user.get("username") or "CyberShield User"

    # Check completion first
    completion = CertificateService.check_category_completion(user_id, vulnerability_type)
    if not completion["completed"]:
        raise HTTPException(
            status_code=400,
            detail=f"Not all labs for {vulnerability_type} are completed yet.",
        )

    cert = CertificateService.generate_category_certificate(
        user_id=user_id,
        user_name=user_name,
        vulnerability_type=vulnerability_type,
        difficulty="Intermediate",
        score=completion["average_score"],
        labs_completed=completion["labs_done"],
        total_labs=completion["total_labs"],
    )
    return {"certificate": cert, "status": "Generated"}


@router.get("/certificate/professional/check")
async def check_professional_cert(user=Depends(get_current_user)):
    """Check if user qualifies for the professional certificate."""
    from app.services.certificate_service import CertificateService
    return CertificateService.check_professional_eligibility(str(user["_id"]))


@router.post("/certificate/professional/generate")
async def generate_professional_cert(user=Depends(get_current_user)):
    """Generate the professional certificate (all 15 categories completed)."""
    from app.services.certificate_service import CertificateService

    user_id = str(user["_id"])
    user_name = user.get("name") or user.get("username") or "CyberShield User"

    eligibility = CertificateService.check_professional_eligibility(user_id)
    if not eligibility["eligible"]:
        raise HTTPException(
            status_code=400,
            detail="Not all 15 OWASP categories are completed yet.",
        )

    cert = CertificateService.generate_professional_certificate(
        user_id=user_id,
        user_name=user_name,
        labs_completed=sum(
            1 for _ in range(15)
        ),
        average_score=0,
    )
    return {"certificate": cert, "status": "Generated"}


# ── Certificate PDF builder (reportlab fallback) ─────────────────────────────
def _build_cert_pdf(cert: dict) -> bytes:
    from io import BytesIO
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=60, rightMargin=60, topMargin=80, bottomMargin=60,
        title="CyberShield Certificate",
    )
    ss = getSampleStyleSheet()
    title = ParagraphStyle(name="CT", parent=ss["Title"], fontSize=28, textColor=colors.HexColor("#1d4ed8"))
    sub = ParagraphStyle(name="CS", parent=ss["Heading2"], textColor=colors.gray, alignment=1)
    body = ParagraphStyle(name="CB", parent=ss["Normal"], fontSize=14, alignment=1, leading=22)

    story = [
        Spacer(1, 40),
        Paragraph("CyberShield", title),
        Paragraph("Certificate of Achievement", sub),
        Spacer(1, 40),
        Paragraph("Awarded To", body),
        Paragraph(str(cert.get("user_name") or "CyberShield User"), ParagraphStyle(
            name="CN", parent=ss["Title"], fontSize=22)),
        Spacer(1, 30),
        Paragraph(f"Completed: <b>{cert.get('course', 'CyberShield Learning Path')}</b>", body),
        Paragraph(f"Score: <b>{cert.get('score', 0)}%</b>", body),
        Paragraph(f"Issued: <b>{_fmt(cert.get('issued_at') or cert.get('date', ''))}</b>", body),
    ]
    doc.build(story)
    return buf.getvalue()


def _fmt(value) -> str:
    if value is None:
        return ""
    try:
        return value.strftime("%Y-%m-%d") if hasattr(value, "strftime") else str(value)
    except Exception:
        fire_and_forget_log()
        return str(value)
