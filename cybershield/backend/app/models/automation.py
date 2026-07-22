"""
Automation models for the Security Notifications / Automation Center
module (Module 6.5).

Collections:
  scheduled_scans   -> per-project scan schedules (daily/weekly/monthly)
  automation_rules  -> conditional rules (IF risk > X THEN notify/email/...)
  security_activity -> append-only security activity timeline
"""
from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field

FREQUENCIES = ["daily", "weekly", "monthly"]
AUTOMATION_ACTIONS = [
    "email",
    "notification",
    "ai_checklist",
    "full_scan",
    "dashboard_update",
    "executive_report",
]


# ── Scheduled scan ----------------------------------------------------------
class ScheduledScanIn(BaseModel):
    project_id: str
    repo_url: Optional[str] = None     # GitHub repo to scan (required for scan runs)
    frequency: str = "daily"           # daily / weekly / monthly
    enabled: bool = True
    run_hour: int = 9                  # hour of day to run (0-23)
    run_minute: int = 0


class ScheduledScanUpdate(BaseModel):
    frequency: Optional[str] = None
    enabled: Optional[bool] = None
    run_hour: Optional[int] = None
    run_minute: Optional[int] = None


# ── Automation rule ---------------------------------------------------------
class AutomationRuleIn(BaseModel):
    name: str
    enabled: bool = True
    # Condition
    condition_type: str = "critical_count"   # critical_count | risk_score | compliance
    operator: str = "gt"                      # gt | gte | lt | lte
    threshold: int = 0
    # Actions to fire when the condition is met
    actions: List[str] = Field(default_factory=lambda: ["notification", "email"])
    project_id: Optional[str] = None


class AutomationRuleUpdate(BaseModel):
    name: Optional[str] = None
    enabled: Optional[bool] = None
    condition_type: Optional[str] = None
    operator: Optional[str] = None
    threshold: Optional[int] = None
    actions: Optional[List[str]] = None
    project_id: Optional[str] = None


# ── Security activity feed --------------------------------------------------
class SecurityActivityIn(BaseModel):
    user_id: Optional[str] = None
    project_id: Optional[str] = None
    event: str                            # e.g. "github_scan", "checklist_updated"
    title: str
    description: str = ""
    metadata: Dict[str, Any] = Field(default_factory=dict)
