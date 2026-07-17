"""
AI Security Copilot routes (Module 5.5).

Mounted under /api/v1/copilot (alongside the legacy copilot router). New paths:
  POST   /copilot/analyze         Generate a full security assessment
  GET    /copilot/report/{id}     Get a stored advisory
  GET    /copilot/history         List the user's previous advisories
  POST   /copilot/chat            Natural-language security query
  GET    /copilot/score/{project} Security score + breakdown
"""
from fastapi import APIRouter, Depends, HTTPException

from app.dependencies.auth import get_current_user
from app.schemas.copilot_schema import (
    CopilotAnalyzeRequest,
    CopilotAnalyzeResponse,
    CopilotChatRequest,
    CopilotChatResponse,
    SecurityAdvisorySummary,
    SecurityScoreResponse,
    RoadmapWeek,
)
from app.services import security_context_service as ctx_svc
from app.services.security_context_service import compute_security_score
from app.ai.copilot_engine import build_copilot_prompt, parse_copilot_response
from app.ai.gemini_client import generate, is_available
from app.database.db import database
from app.models.copilot_model import advisory_document

router = APIRouter()

advisories = database.security_advisories


async def _run_analysis(user_id: str, project_id: str = None, question: str = None):
    """Shared analysis pipeline used by /analyze and /chat."""
    context = await ctx_svc.build_security_context(user_id, project_id)
    proj_id = project_id or (context.get("project"))
    prompt = build_copilot_prompt(context, question)

    if is_available():
        try:
            text = await generate(prompt)
            parsed = parse_copilot_response(
                text, context["security_score"], context["risk_level"]
            )
        except Exception as e:
            parsed = parse_copilot_response(
                "", context["security_score"], context["risk_level"]
            )
            parsed["summary"] = f"AI analysis failed ({e}). Showing heuristic assessment."
    else:
        parsed = parse_copilot_response(
            "", context["security_score"], context["risk_level"]
        )

    # Persist advisory
    doc = advisory_document(
        user_id=user_id,
        project_id=proj_id or "",
        project=context.get("project"),
        security_score=parsed["security_score"],
        risk_level=parsed["risk_level"],
        summary=parsed["summary"],
        critical_findings=parsed["critical_findings"],
        recommendations=parsed["recommendations"],
        roadmap=parsed["roadmap"],
        raw_context=context,
    )
    await advisories.insert_one(doc)

    return doc, context, parsed


@router.post("/analyze", response_model=CopilotAnalyzeResponse)
async def analyze(payload: CopilotAnalyzeRequest, user=Depends(get_current_user)):
    """Generate a complete security assessment (spec Step 5)."""
    user_id = str(user["_id"])
    doc, context, parsed = await _run_analysis(
        user_id, payload.project_id, payload.question
    )
    return CopilotAnalyzeResponse(
        advisory_id=doc["_id"],
        project_id=doc.get("project_id") or None,
        project=doc.get("project"),
        risk_level=parsed["risk_level"],
        security_score=parsed["security_score"],
        summary=parsed["summary"],
        critical_findings=parsed["critical_findings"],
        recommendations=parsed["recommendations"],
        roadmap=[RoadmapWeek(**w) for w in parsed["roadmap"]],
        raw_context=context,
    )


@router.get("/report/{advisory_id}", response_model=CopilotAnalyzeResponse)
async def get_report(advisory_id: str, user=Depends(get_current_user)):
    """Get a stored advisory (spec Step 17)."""
    user_id = str(user["_id"])
    doc = await advisories.find_one({"_id": advisory_id, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Advisory not found")
    return CopilotAnalyzeResponse(
        advisory_id=doc["_id"],
        project_id=doc.get("project_id") or None,
        project=doc.get("project"),
        risk_level=doc.get("risk_level", ""),
        security_score=doc.get("security_score", 0),
        summary=doc.get("summary", ""),
        critical_findings=doc.get("critical_findings", []),
        recommendations=doc.get("recommendations", []),
        roadmap=[RoadmapWeek(**w) for w in doc.get("roadmap", [])],
        raw_context=doc.get("raw_context", {}),
    )


@router.get("/history", response_model=list[SecurityAdvisorySummary])
async def history(user=Depends(get_current_user)):
    """List previous advisories (spec Step 17)."""
    user_id = str(user["_id"])
    cursor = advisories.find({"user_id": user_id}).sort("created_at", -1)
    out = []
    async for doc in cursor:
        out.append(SecurityAdvisorySummary(
            id=doc["_id"],
            project=doc.get("project"),
            risk_level=doc.get("risk_level", ""),
            security_score=doc.get("security_score", 0),
            summary=doc.get("summary", ""),
            created_at=doc.get("created_at").isoformat() if doc.get("created_at") else "",
        ))
    return out


@router.post("/chat", response_model=CopilotChatResponse)
async def chat(payload: CopilotChatRequest, user=Depends(get_current_user)):
    """
    Natural-language security query against the project context (spec Step 11).

    For open-ended questions we run a fresh analysis and return the advisory;
    the conversational answer is the AI summary. This keeps the endpoint
    self-contained without a separate conversation store.
    """
    user_id = str(user["_id"])
    doc, context, parsed = await _run_analysis(
        user_id, payload.project_id, payload.question
    )
    return CopilotChatResponse(
        answer=parsed["summary"],
        advisory=CopilotAnalyzeResponse(
            advisory_id=doc["_id"],
            project_id=doc.get("project_id") or None,
            project=doc.get("project"),
            risk_level=parsed["risk_level"],
            security_score=parsed["security_score"],
            summary=parsed["summary"],
            critical_findings=parsed["critical_findings"],
            recommendations=parsed["recommendations"],
            roadmap=[RoadmapWeek(**w) for w in parsed["roadmap"]],
            raw_context=context,
        ),
    )


@router.get("/score/{project_id}", response_model=SecurityScoreResponse)
async def score(project_id: str, user=Depends(get_current_user)):
    """Security score + breakdown for a project (spec Step 17)."""
    user_id = str(user["_id"])
    context = await ctx_svc.build_security_context(user_id, project_id)
    score, risk = compute_security_score(context)
    return SecurityScoreResponse(
        project_id=project_id,
        project=context.get("project"),
        security_score=score,
        risk_level=risk,
        breakdown={
            "github_scan": context.get("github_scan"),
            "threat_model": context.get("threat_model"),
            "owasp": context.get("owasp"),
            "code_review": context.get("code_review"),
            "remediation": context.get("remediation"),
        },
    )
