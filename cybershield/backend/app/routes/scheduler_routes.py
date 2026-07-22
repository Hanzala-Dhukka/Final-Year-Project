"""
Scheduler & Automation API routes (Module 6.5).

Endpoints (all under /api/v1/automation):
  POST   /scheduler/create              -> create a scheduled scan
  PUT    /scheduler/{id}                -> update a scheduled scan
  DELETE /scheduler/{id}                -> delete a scheduled scan
  POST   /scheduler/run/{project_id}    -> manual scan trigger
  GET    /scheduler                     -> list schedules
  GET    /scheduler/due                 -> due schedules (internal/testing)

  POST   /rules                         -> create automation rule
  GET    /rules                         -> list automation rules
  PUT    /rules/{id}                    -> update automation rule
  DELETE /rules/{id}                    -> delete automation rule

  GET    /activity                      -> security activity feed
  GET    /activity/{project_id}         -> project activity feed
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional

from app.dependencies.auth import get_current_user
from app.services import automation_service
from app.services import notification_service as notif
from app.services import scheduled_scan

router = APIRouter(prefix="/api/v1/automation", tags=["Automation & Scheduler"])


# ── Scheduled scans ───────────────────────────────────────────────────────────
@router.post("/scheduler/create")
async def create_schedule(payload: dict, current_user: dict = Depends(get_current_user)):
    """Create a scheduled scan for a project."""
    project_id = payload.get("project_id")
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")
    sch = await automation_service.create_schedule(
        user_id=str(current_user["_id"]),
        project_id=str(project_id),
        repo_url=payload.get("repo_url"),
        frequency=payload.get("frequency", "daily"),
        enabled=payload.get("enabled", True),
        run_hour=payload.get("run_hour", 9),
        run_minute=payload.get("run_minute", 0),
    )
    await notif.log_activity(str(current_user["_id"]), "schedule_created",
                       "Scan schedule created",
                       f"Created a {sch['frequency']} schedule.", project_id=project_id)
    return {"schedule": sch, "message": "Schedule created"}


@router.put("/scheduler/{schedule_id}")
async def update_schedule(schedule_id: str, payload: dict,
                          current_user: dict = Depends(get_current_user)):
    updated = await automation_service.update_schedule(schedule_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"schedule": updated, "message": "Schedule updated"}


@router.delete("/scheduler/{schedule_id}")
async def delete_schedule(schedule_id: str, current_user: dict = Depends(get_current_user)):
    ok = await automation_service.delete_schedule(schedule_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Schedule deleted"}


@router.get("/scheduler")
async def list_schedules(current_user: dict = Depends(get_current_user)):
    return await automation_service.get_schedules(str(current_user["_id"]))


@router.get("/scheduler/due")
async def due_schedules(current_user: dict = Depends(get_current_user)):
    """Return schedules that are currently due (testing / inspection)."""
    due = await automation_service.get_due_schedules()
    return [automation_service._serialise_schedule(d) for d in due]


@router.post("/scheduler/run/{project_id}")
async def manual_run(project_id: str, payload: Optional[dict] = None,
                     current_user: dict = Depends(get_current_user)):
    """Manually trigger a scan for a project."""
    repo_url = (payload or {}).get("repo_url")
    if not repo_url:
        # Fall back to the most recent scan's repo for the project/user.
        from app.repositories.github_repository import github_repository
        scans = github_repository.get_user_scans(str(current_user["_id"]), limit=10)
        for s in scans:
            if s.get("repo_url"):
                repo_url = s["repo_url"]
                break
    if not repo_url:
        raise HTTPException(status_code=400, detail="repo_url is required (no prior scan found)")
    result = await scheduled_scan.manual_scan(str(project_id), repo_url, str(current_user["_id"]))
    return {"message": "Manual scan completed", "result": result}


# ── Automation rules ──────────────────────────────────────────────────────────
@router.post("/rules")
async def create_rule(payload: dict, current_user: dict = Depends(get_current_user)):
    rule = await automation_service.create_rule(str(current_user["_id"]), payload)
    return {"rule": rule, "message": "Rule created"}


@router.get("/rules")
async def list_rules(current_user: dict = Depends(get_current_user)):
    return await automation_service.get_rules(str(current_user["_id"]))


@router.put("/rules/{rule_id}")
async def update_rule(rule_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    updated = await automation_service.update_rule(rule_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"rule": updated, "message": "Rule updated"}


@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str, current_user: dict = Depends(get_current_user)):
    ok = await automation_service.delete_rule(rule_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"message": "Rule deleted"}


# ── Security activity feed ────────────────────────────────────────────────────
@router.get("/activity")
async def activity_feed(current_user: dict = Depends(get_current_user),
                        project_id: Optional[str] = None, limit: int = 100):
    if project_id:
        return await notif.get_project_activity_feed(project_id, limit)
    return await notif.get_activity_feed(str(current_user["_id"]), limit)


@router.get("/activity/{project_id}")
async def project_activity(project_id: str, current_user: dict = Depends(get_current_user)):
    return await notif.get_project_activity_feed(project_id, 100)
