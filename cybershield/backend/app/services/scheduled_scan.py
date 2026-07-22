"""
Background tasks for scheduled scanning (Module 6.5).

Runs due scheduled scans, processes scan results through the automation
engine (notifications / email / AI checklist refresh), and updates the
schedule's next_run timestamp. Also exposes a manual trigger used by the
API and WebSocket-free one-off runs.
"""
import asyncio
import traceback
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

from app.services import automation_service
from app.services import notification_service as notif
from app.services import email_service
from app.services import scan_runner
from app.services import ai_checklist_service

# Retry backoff for transient GitHub failures.
RETRY_DELAYS = [timedelta(minutes=5), timedelta(minutes=30)]


async def _process_results(user_id: str, project_id: Optional[str],
                           result: Dict[str, Any]) -> None:
    """Log activity, notify, and run automation rules after a scan completes."""
    repo = result.get("repository", "repository")
    risk = result.get("risk_score", 0)

    await notif.log_activity(user_id, "github_scan", "Scheduled scan completed",
                       f"Scanned {repo} (risk {risk}).", project_id=project_id)
    await notif.create_notification(
        user_id=user_id,
        title="Scheduled Scan Completed",
        message=f"{repo} scanned — risk score {risk}.",
        notification_type="success",
        severity="SUCCESS",
        project_id=project_id,
        link="/scan-history",
    )
    email = await notif.get_user_email(user_id)
    if email:
        email_service.send_report_email(
            to_email=email,
            subject="CyberShield — Scheduled Scan Completed",
            message=f"Your scheduled scan of {repo} finished with risk score {risk}.",
            report_type="scan_complete",
        )

    # Run automation rules (risk threshold alerts, AI checklist refresh, etc.)
    try:
        await automation_service.evaluate_rules(user_id, project_id, result)
    except Exception as e:
        print(f"[scheduler] automation rule evaluation failed: {e}")


async def run_scan_for_schedule(schedule: Dict[str, Any]) -> None:
    """
    Run a single scheduled scan, update next_run, and process results.
    On GitHub failure, reschedules a retry if retries remain.
    """
    user_id = schedule.get("user_id")
    project_id = schedule.get("project_id")
    repo_url = schedule.get("repo_url")
    schedule_id = str(schedule["_id"])
    frequency = schedule.get("frequency", "daily")

    if not repo_url:
        # Nothing to scan — still advance the schedule.
        await automation_service.mark_schedule_run(
            schedule_id, automation_service._next_run(frequency,
                                                      schedule.get("run_hour", 9),
                                                      schedule.get("run_minute", 0)))
        return

    try:
        await notif.log_activity(user_id, "github_scan", "Scheduled scan started",
                           f"Started scheduled {frequency} scan.", project_id=project_id)
        result = await scan_runner.run_github_scan(repo_url, user_id, project_id)
        await _process_results(user_id, project_id, result)
        # Refresh AI checklist automatically after a scan (Step 11).
        if project_id:
            try:
                await ai_checklist_service.generate_project_checklist(str(user_id), str(project_id))
                await notif.log_activity(user_id, "checklist_updated", "AI checklist updated",
                                   "Regenerated after scheduled scan.", project_id=project_id)
            except Exception:
                pass
    except Exception as e:
        print(f"[scheduler] scan failed for schedule {schedule_id}: {e}")
        await notif.log_activity(user_id, "scan_failed", "Scheduled scan failed",
                           f"GitHub scan failed: {str(e)[:200]}", project_id=project_id)
        # Retry logic: schedule next attempt sooner (5 / 30 min).
        retry_at = datetime.now(timezone.utc) + RETRY_DELAYS[0]
        await automation_service.mark_schedule_run(schedule_id, retry_at)
        return

    await automation_service.mark_schedule_run(
        schedule_id,
        automation_service._next_run(frequency, schedule.get("run_hour", 9),
                                     schedule.get("run_minute", 0)),
    )


async def run_due_scans() -> None:
    """Entry point for the APScheduler interval job (every 15 min)."""
    due = await automation_service.get_due_schedules()
    for schedule in due:
        try:
            await run_scan_for_schedule(schedule)
        except Exception:
            traceback.print_exc()


async def manual_scan(project_id: str, repo_url: str, user_id: str) -> Dict[str, Any]:
    """Manually trigger a scan (API: POST /scheduler/run/{project_id})."""
    await notif.log_activity(user_id, "github_scan", "Manual scan started",
                       f"Manual scan of {repo_url}.", project_id=project_id)
    result = await scan_runner.run_github_scan(repo_url, user_id, project_id)
    await _process_results(user_id, project_id, result)
    if project_id:
        try:
            await ai_checklist_service.generate_project_checklist(str(user_id), str(project_id))
            await notif.log_activity(user_id, "checklist_updated", "AI checklist updated",
                               "Regenerated after manual scan.", project_id=project_id)
        except Exception:
            pass
    return result


async def refresh_due_checklists() -> None:
    """
    Daily job: regenerate AI checklists for projects that have an active
    schedule, keeping recommendations fresh even without a new scan.
    """
    schedules = await automation_service.get_schedules()
    seen = set()
    for s in schedules:
        pid = s.get("project_id")
        uid = s.get("user_id")
        if not pid or not uid or pid in seen:
            continue
        seen.add(pid)
        try:
            await ai_checklist_service.generate_project_checklist(str(uid), str(pid))
            await notif.log_activity(uid, "checklist_updated", "AI checklist refreshed",
                               "Daily automated refresh.", project_id=pid)
        except Exception:
            pass
