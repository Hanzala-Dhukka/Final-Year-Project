"""
Scheduled report generation (Module 6.5).

Generates weekly / monthly security & compliance summary reports and emails
them to each user who has an active schedule. Used by APScheduler cron jobs.
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

from app.services import automation_service
from app.services import notification_service as notif
from app.services import email_service


def _latest_scan(user_id: str) -> Optional[Dict[str, Any]]:
    from app.repositories.github_repository import github_repository
    scans = github_repository.get_user_scans(user_id, limit=5)
    return scans[0] if scans else None


async def generate_weekly_reports() -> None:
    """Weekly security report for every user with an active schedule."""
    schedules = await automation_service.get_schedules()
    seen = set()
    for s in schedules:
        uid = s.get("user_id")
        if not uid or uid in seen:
            continue
        seen.add(uid)
        await _send_report(uid, "weekly")


async def generate_monthly_reports() -> None:
    """Monthly compliance report for every user with an active schedule."""
    schedules = await automation_service.get_schedules()
    seen = set()
    for s in schedules:
        uid = s.get("user_id")
        if not uid or uid in seen:
            continue
        seen.add(uid)
        await _send_report(uid, "monthly")


async def _send_report(user_id: str, kind: str) -> None:
    """Build a summary and email it to the user."""
    scan = _latest_scan(user_id)
    if scan:
        risk = scan.get("risk_score", 0)
        repo = scan.get("repository", "your repositories")
        message = (
            f"Here is your {kind} CyberShield summary.\n"
            f"Latest scan: {repo}\nRisk Score: {risk}\n"
            f"Vulnerabilities found: {scan.get('vulnerabilities_found', 0)}"
        )
        subject = f"CyberShield — {kind.capitalize()} Security Report"
    else:
        message = f"Your {kind} CyberShield summary: no scans recorded yet. Run a scan to start monitoring."
        subject = f"CyberShield — {kind.capitalize()} Security Report"

    await notif.log_activity(user_id, "report_generated", f"{kind.capitalize()} report generated",
                       f"Generated a {kind} security report.")
    await notif.create_notification(
        user_id=user_id,
        title=f"{kind.capitalize()} Report Ready",
        message=f"Your {kind} security report has been generated.",
        notification_type="information",
        severity="INFO",
        link="/scan-history",
    )
    email = await notif.get_user_email(user_id)
    if email:
        email_service.send_report_email(
            to_email=email,
            subject=subject,
            message=message,
            report_type=f"{kind}_report",
        )
