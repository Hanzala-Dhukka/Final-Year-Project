"""
Scheduler service (Module 6.5).

Wires the recurring background jobs into the global APScheduler instance:
  * daily scan    — run all due daily schedules
  * weekly scan   — run all due weekly schedules
  * monthly scan  — run all due monthly schedules
  * generate reports
  * delete old notifications
  * refresh AI checklist

The jobs are registered on app startup in main.py.
"""
from app.services.scheduler import scheduler
from app.services import automation_service
from app.services import scheduled_scan
from app.services import scheduled_reports
from app.services import notification_service


def register_scheduler_jobs() -> None:
    """Register all recurring jobs with APScheduler (idempotent)."""
    # Run due scans every 15 minutes — picks up daily/weekly/monthly by next_run.
    scheduler.add_job(
        scheduled_scan.run_due_scans,
        "interval",
        minutes=15,
        id="run_due_scans",
        replace_existing=True,
        coalesce=True,
    )

    # Weekly executive report — Mondays 08:00
    scheduler.add_job(
        scheduled_reports.generate_weekly_reports,
        "cron",
        day_of_week="mon",
        hour=8,
        id="weekly_reports",
        replace_existing=True,
        coalesce=True,
    )

    # Monthly compliance report — 1st of month 08:00
    scheduler.add_job(
        scheduled_reports.generate_monthly_reports,
        "cron",
        day=1,
        hour=8,
        id="monthly_reports",
        replace_existing=True,
        coalesce=True,
    )

    # Delete notifications older than 30 days — daily 03:00
    import asyncio

    def _delete_old_notifications(older_than_days: int = 30) -> int:
        """Sync wrapper so APScheduler can run the async cleanup coroutine."""
        return asyncio.run(notification_service.delete_old_notifications(older_than_days))

    scheduler.add_job(
        _delete_old_notifications,
        "cron",
        hour=3,
        minute=0,
        kwargs={"older_than_days": 30},
        id="delete_old_notifications",
        replace_existing=True,
        coalesce=True,
    )

    # Refresh AI checklists for active schedules — daily 04:00
    scheduler.add_job(
        scheduled_scan.refresh_due_checklists,
        "cron",
        hour=4,
        minute=0,
        id="refresh_ai_checklists",
        replace_existing=True,
        coalesce=True,
    )


__all__ = ["register_scheduler_jobs", "scheduler"]
