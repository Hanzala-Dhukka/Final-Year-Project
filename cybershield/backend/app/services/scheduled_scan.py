"""
Background tasks for scheduled scanning (Module 6.5).

Runs due scheduled scans, processes scan results through the automation
engine (notifications / email / AI checklist refresh), and updates the
schedule's next_run timestamp. Also exposes a manual trigger used by the
API and WebSocket-free one-off runs.
"""
import asyncio
import traceback
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

from bson import ObjectId

from app.database.db import database
from app.models.workspace_model import (
    build_report_doc,
    build_activity_doc,
    build_audit_doc,
)
from app.utils.user_names import display_name
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
        await email_service.send_report_email(
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
    return await run_project_scan(project_id, repo_url, user_id)


async def _get_actor_name(user_id: str) -> str:
    """Resolve a user's display name for activity/audit logs."""
    try:
        if ObjectId.is_valid(user_id):
            user_doc = await database.users.find_one({"_id": ObjectId(user_id)})
            return display_name(user_doc, "Scheduled Scan")
    except Exception:
        pass
    return "Scheduled Scan"


async def _persist_report_version(project_id: str, user_id: str,
                                  scan_uuid: str, result: Dict[str, Any]) -> Optional[int]:
    """
    Create a project report version from a GitHub scan result.

    This is what makes the scan visible on the Version History page, the
    Project Dashboard and the Projects list (latest_risk_score / risk_level
    are derived from the most recent project_reports row).
    """
    try:
        scan_doc = {}
        scan_db_id = result.get("scan_id")
        if scan_db_id and ObjectId.is_valid(str(scan_db_id)):
            scan_doc = await database["github_scans"].find_one(
                {"_id": ObjectId(str(scan_db_id))}
            ) or {}

        severity_summary = scan_doc.get("severity_summary") or \
            (scan_doc.get("risk_dashboard") or {}).get("severity_distribution") or \
            {"critical": 0, "high": 0, "medium": 0, "low": 0}

        threats = []
        for finding in (scan_doc.get("findings") or []):
            if not isinstance(finding, dict):
                continue
            name = (finding.get("title") or finding.get("name") or
                    finding.get("type") or finding.get("message") or "")
            if not name:
                continue
            score = finding.get("risk_score")
            if not isinstance(score, (int, float)) or isinstance(score, bool):
                score = finding.get("score")
            threats.append({
                "name": name,
                "severity": finding.get("severity", ""),
                "score": score,
                "file": finding.get("file", ""),
            })

        ai_report = scan_doc.get("ai_report") or {}
        data = {
            "repository": scan_doc.get("repository") or result.get("repository"),
            "distribution": severity_summary,
            "threats": threats[:100],
            "summary": scan_doc.get("summary") or ai_report.get("summary") or "",
            "scanned_files": scan_doc.get("scanned_files", result.get("scanned_files", 0)),
            "vulnerabilities_found": len(scan_doc.get("findings") or []) +
                                      len(scan_doc.get("dependency_findings") or []),
            "risk_level": result.get("risk_level", "Unknown"),
            "scan_id": scan_uuid,
            "risk_dashboard": scan_doc.get("risk_dashboard", {}),
        }

        version = await database.project_reports.count_documents(
            {"project_id": project_id}) + 1
        doc = build_report_doc(
            project_id=project_id,
            user_id=user_id,
            version=version,
            risk_score=int(result.get("risk_score") or 0),
            risk_level=result.get("risk_level", "Unknown"),
            data=data,
        )
        await database.project_reports.insert_one(doc)

        actor = await _get_actor_name(user_id)
        await database.activity_logs.insert_one(build_activity_doc(
            project_id=project_id,
            user_id=user_id,
            user_name=actor,
            action="Threat Report Generated",
            detail=f"Version {version} from GitHub scan (risk {result.get('risk_score', 0)})",
        ))
        await database.audit_logs.insert_one(build_audit_doc(
            user_id=user_id,
            user_name=actor,
            action="Generated Threat Report",
            target=project_id,
        ))
        return version
    except Exception as e:
        print(f"[scheduled_scan] failed to persist report version: {e}")
        return None


async def _refresh_hardening(project_id: str, user_id: str, scan_uuid: str) -> None:
    """
    Feed a completed scan into the Security Hardening page:
      * SC3 scan recommendations (user_checklists)
      * AI checklist regeneration
      * posture snapshot so posture-history trends update
    """
    try:
        from app.recommendation.service import create_recommendations
        await create_recommendations(
            scan_id=scan_uuid, user_id=str(user_id), project_id=str(project_id))
    except Exception as e:
        print(f"[scheduled_scan] recommendation generation failed: {e}")

    try:
        from app.services.checklist_service import get_user_progress
        from app.services.scoring_service import calculate_posture, save_posture_snapshot
        tasks = await get_user_progress(str(user_id), str(project_id))
        posture = calculate_posture(tasks)
        await save_posture_snapshot(str(user_id), str(project_id), posture)
    except Exception as e:
        print(f"[scheduled_scan] posture snapshot failed: {e}")

    try:
        await ai_checklist_service.generate_project_checklist(
            str(user_id), str(project_id))
        await notif.log_activity(user_id, "checklist_updated", "AI checklist updated",
                                 "Regenerated after GitHub scan.", project_id=project_id)
    except Exception:
        pass


async def _refresh_compliance(project_id: str, user_id: str, scan_uuid: str) -> None:
    """
    Feed a completed scan into the Compliance Dashboard and the analytics trends.

    Generates + persists a compliance report (so Compliance Dashboard / Executive
    compliance KPI show real scan-derived scores) and records an analytics
    snapshot (so the Security Analytics trend charts are populated per scan).
    """
    compliance_score = 0.0
    try:
        from app.services import compliance_service
        report = await compliance_service.generate_compliance(
            str(user_id), str(project_id))
        if report:
            await compliance_service.save_report(report)
            compliance_score = report.get("overall_score") or 0.0
    except Exception as e:
        print(f"[scheduled_scan] compliance generation failed: {e}")

    try:
        from app.services import trend_service
        scan_doc = await database["github_scans"].find_one(
            {"scan_id": scan_uuid}) or {}
        sev = {
            "critical": int((scan_doc.get("severity_summary") or {}).get("critical", 0)),
            "high": int((scan_doc.get("severity_summary") or {}).get("high", 0)),
            "medium": int((scan_doc.get("severity_summary") or {}).get("medium", 0)),
            "low": int((scan_doc.get("severity_summary") or {}).get("low", 0)),
        }
        for dep in scan_doc.get("dependency_findings") or []:
            if not isinstance(dep, dict):
                continue
            s = str(dep.get("severity", "")).lower()
            if s in sev:
                sev[s] += 1
        risk_score = float(scan_doc.get("risk_score") or 0)
        await trend_service.record_snapshot(
            user_id=str(user_id),
            project_id=str(project_id),
            security_score=max(0.0, min(100.0, 100.0 - risk_score)),
            risk_score=risk_score,
            compliance_score=compliance_score,
            sev_override=sev,
        )
    except Exception as e:
        print(f"[scheduled_scan] analytics snapshot failed: {e}")


async def run_project_scan(project_id: str, repo_url: str, user_id: str) -> Dict[str, Any]:
    """
    Run a GitHub scan for a project and persist results across all pages.

    Uses the existing scanner pipeline unchanged and makes the outcome visible
    on the Dashboard, Security Analytics, Security Hardening, Version History
    and Activity Timeline pages. Used on project creation, manual triggers and
    the daily rescan job.
    """
    scan_uuid = str(uuid.uuid4())
    await notif.log_activity(user_id, "github_scan", "GitHub scan started",
                             f"Scanning {repo_url} for project.",
                             project_id=project_id)
    result = await scan_runner.run_github_scan(
        repo_url, user_id, project_id, scan_id=scan_uuid)
    await _persist_report_version(project_id, user_id, scan_uuid, result)
    await _process_results(user_id, project_id, result)
    if project_id:
        await _refresh_hardening(project_id, user_id, scan_uuid)
        await _refresh_compliance(project_id, user_id, scan_uuid)
    return result


async def schedule_project_scan(project_id: str, repo_url: str, user_id: str) -> None:
    """Fire-and-forget background wrapper used for auto-scans (never raises)."""
    try:
        await run_project_scan(project_id, repo_url, user_id)
    except Exception as e:
        print(f"[scheduled_scan] background scan failed for project {project_id}: {e}")
        try:
            await notif.log_activity(user_id, "scan_failed", "GitHub scan failed",
                                     f"Automatic scan error: {str(e)[:200]}",
                                     project_id=project_id)
        except Exception:
            pass


async def run_daily_scans() -> None:
    """
    Daily job: re-scan every project that has a repository URL.

    Guarded so each project is only scanned once per ~20h window even when it
    also has its own automation schedule.
    """
    cursor = database.projects.find({"repo_url": {"$nin": ["", None]}})
    async for project_doc in cursor:
        project_id = str(project_doc["_id"])
        repo_url = (project_doc.get("repo_url") or "").strip()
        owner_id = project_doc.get("owner_id")
        if not repo_url or not owner_id:
            continue
        try:
            latest = await database["github_scans"].find_one(
                {"project_id": project_id}, sort=[("created_at", -1)])
            if latest and latest.get("created_at"):
                age = datetime.utcnow() - latest["created_at"]
                if age < timedelta(hours=20):
                    continue
            await run_project_scan(project_id, repo_url, str(owner_id))
        except Exception as e:
            print(f"[scheduled_scan] daily scan failed for project {project_id}: {e}")
            traceback.print_exc()


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
