"""
Rule Mapping API routes (Module SC2).

Endpoints:
  POST /api/v1/rules/match        → match a single finding
  POST /api/v1/rules/match-batch  → match multiple findings
  GET  /api/v1/rules              → list all available rules
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from .rule_engine import process_finding, process_findings
from .checklist_rules import CHECKLIST_RULES

router = APIRouter(prefix="/api/v1/rules", tags=["Rule Mapping"])


# ── Request / Response models ────────────────────────────────────────────────

class FindingIn(BaseModel):
    """A single scanner finding."""
    type: str = ""
    description: str = ""
    title: str = ""


class FindingBatchIn(BaseModel):
    """Batch of scanner findings."""
    findings: List[Dict[str, Any]]


class MappedRuleOut(BaseModel):
    """A finding mapped to a checklist rule."""
    scan_finding: dict
    checklist_rule: str
    task: str
    category: str
    severity: str


class RuleInfoOut(BaseModel):
    """Summary of a single rule in the database."""
    rule_id: str
    task: str
    category: str
    severity: str
    patterns: List[str]


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/match", response_model=Optional[MappedRuleOut])
async def match_single_finding(payload: FindingIn):
    """Match a single scanner finding to a checklist rule.

    Returns the mapped rule if found, or 404 if no rule matches.
    """
    finding = {
        "type": payload.type,
        "description": payload.description,
        "title": payload.title,
    }
    result = process_finding(finding)
    if result is None:
        raise HTTPException(status_code=404, detail="No matching rule found for this finding.")
    return result


@router.post("/match-batch", response_model=List[MappedRuleOut])
async def match_batch_findings(payload: FindingBatchIn):
    """Match multiple scanner findings to checklist rules.

    Returns all matched rules, deduplicated by rule_id.
    """
    results = process_findings(payload.findings)
    return results


@router.get("", response_model=List[RuleInfoOut])
async def list_rules():
    """List all available rule mappings."""
    return [
        RuleInfoOut(
            rule_id=rule_id,
            task=rule["task"],
            category=rule["category"],
            severity=rule["severity"],
            patterns=rule["patterns"],
        )
        for rule_id, rule in CHECKLIST_RULES.items()
    ]
