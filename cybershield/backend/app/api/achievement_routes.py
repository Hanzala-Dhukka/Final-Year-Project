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
)
from app.models.gamification import learning_goal_document
from app.database.db import database

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
async def create_goal(payload: LearningGoalRequest, user=Depends(get_current_user)):
    return await create_goal(str(user["_id"]), payload)


@router.get("/certificate/{certificate_id}/download")
async def download_certificate(certificate_id: str, user=Depends(get_current_user)):
    """Generate and stream a certificate PDF (spec Step 10/11)."""
    from bson import ObjectId

    try:
        cert = await database["certificates"].find_one({"_id": ObjectId(certificate_id)})
    except Exception:
        cert = None
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    # Ensure the cert belongs to the user
    if str(cert.get("user_id")) != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Forbidden")

    pdf = _build_cert_pdf(cert)
    filename = f"certificate_{certificate_id}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ── Certificate PDF builder (reportlab) ─────────────────────────────────────
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
        Paragraph(f"Issued: <b>{_fmt(cert.get('issued_at'))}</b>", body),
    ]
    doc.build(story)
    return buf.getvalue()


def _fmt(value) -> str:
    if value is None:
        return ""
    try:
        return value.strftime("%Y-%m-%d") if hasattr(value, "strftime") else str(value)
    except Exception:
        return str(value)
