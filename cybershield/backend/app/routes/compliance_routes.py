"""
Compliance Center API routes (Module 6.3).

Endpoints:
  POST   /compliance/generate                 -> build + persist a report
  GET    /compliance/{project_id}             -> latest report + history
  GET    /compliance/projects                  -> projects available to the user
  GET    /compliance/export/pdf/{project_id}  -> downloadable PDF report
  GET    /compliance/export/json/{project_id} -> downloadable JSON report
"""
import io
import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse

from app.dependencies.auth import get_current_user
from app.services import compliance_service as svc
from app.schemas.compliance_schema import GenerateComplianceIn, ComplianceReportOut

router = APIRouter(prefix="/api/v1/compliance", tags=["Compliance Center"])


@router.post("/generate", response_model=dict)
async def generate(
    payload: GenerateComplianceIn,
    current_user: dict = Depends(get_current_user),
):
    """Generate (and persist) a compliance report for a project."""
    try:
        report = await svc.generate_compliance(
            str(current_user["_id"]), payload.project_id
        )
        report_id = await svc.save_report(report)
        report["id"] = report_id
        history = await svc.get_history(payload.project_id)
        return {
            "id": report_id,
            "report": _to_response(report),
            "history": history,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate compliance report: {str(e)}"
        )


@router.get("/projects")
async def list_projects(current_user: dict = Depends(get_current_user)):
    """Return the projects the current user can run compliance on."""
    from bson import ObjectId

    user_id = str(current_user["_id"])
    is_admin = current_user.get("role") == "admin"
    query = {} if is_admin else {"owner_id": user_id}
    projects = []
    async for doc in svc.database["projects"].find(query).sort("created_at", -1):
        projects.append({
            "id": str(doc["_id"]),
            "name": doc.get("name", "Untitled Project"),
            "description": doc.get("description", ""),
        })
    return projects


@router.get("/{project_id}", response_model=ComplianceReportOut)
async def get_report(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Return the latest compliance report + history for a project."""
    report = await svc.get_report(project_id)
    if not report:
        # No report yet -> return an empty shell so the UI can prompt generation.
        return ComplianceReportOut(
            project_id=project_id,
            frameworks={},
            summary={"overall_score": 0.0, "frameworks": {}},
            gap_analysis=[],
            history=await svc.get_history(project_id),
        )
    history = await svc.get_history(project_id)
    return _to_response(report, history)


@router.get("/export/pdf/{project_id}")
async def export_pdf(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Download the latest compliance report as a PDF."""
    report = await svc.get_report(project_id)
    if not report:
        raise HTTPException(status_code=404, detail="No compliance report found.")
    html = _build_pdf_html(report)
    project = report.get("project_name", "report").replace(" ", "_")
    filename = f"{project}_Compliance_Report.pdf"
    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html).write_pdf()
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception:
        # Fallback: serve the HTML directly.
        return StreamingResponse(
            io.StringIO(html),
            media_type="text/html",
            headers={"Content-Disposition": f"attachment; filename={project}_Compliance_Report.html"},
        )


@router.get("/export/json/{project_id}")
async def export_json(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Download the latest compliance report as JSON."""
    report = await svc.get_report(project_id)
    if not report:
        raise HTTPException(status_code=404, detail="No compliance report found.")
    clean = {k: v for k, v in report.items() if k != "_id"}
    clean["id"] = report.get("id") or str(report.get("_id", ""))
    return StreamingResponse(
        io.StringIO(json.dumps(clean, indent=2, default=str)),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={report.get('project_name', 'report').replace(' ', '_')}_Compliance_Report.json"
        },
    )


# ── Helpers ──────────────────────────────────────────────────────────────────
def _to_response(report: dict, history: list = None) -> dict:
    """Shape a stored report document into the API response model."""
    breakdown = report.get("breakdown", {})
    out = {
        "id": report.get("id") or str(report.get("_id", "")),
        "project_id": report.get("project_id"),
        "project_name": report.get("project_name"),
        "overall_score": report.get("overall_score", 0.0),
        "frameworks": report.get("frameworks", {}),
        "summary": report.get("summary", {}),
        "breakdown": breakdown,
        "gap_analysis": report.get("gap_analysis", []),
        "recommendations": report.get("recommendations", {}),
        "sources": report.get("sources", {}),
        "history": history if history is not None else [],
        "created_at": report.get("created_at"),
    }
    return out


def _build_pdf_html(report: dict) -> str:
    """Render a compliance report to standalone HTML for PDF export."""
    frameworks = report.get("frameworks", {})
    gap = report.get("gap_analysis", [])
    rec = report.get("recommendations", {})
    summary = report.get("summary", {})
    rows = "".join(
        f"<tr><td>{name}</td><td>{score}%</td></tr>"
        for name, score in frameworks.items()
    )
    gap_html = ""
    for g in gap:
        missing = ", ".join(g.get("missing") or []) or "None"
        gap_html += f"<p><strong>{g['framework']}</strong> ({g['score']}%): missing {missing}</p>"
    actions = "".join(
        f"<li>{a}</li>" for a in (rec.get("priority_actions") or [])
    )
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>CyberShield Compliance Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; padding: 30px; color: #1f2937; }}
            h1 {{ color: #111827; }}
            h2 {{ border-bottom: 2px solid #2563EB; padding-bottom: 6px; margin-top: 30px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
            th, td {{ border: 1px solid #e5e7eb; padding: 10px; text-align: left; }}
            th {{ background: #2563EB; color: #fff; }}
            .metric {{ font-size: 40px; font-weight: bold; color: #2563EB; }}
        </style>
    </head>
    <body>
        <h1>CyberShield Compliance Report</h1>
        <p><strong>Project:</strong> {report.get('project_name', 'Untitled')}</p>
        <p><strong>Generated:</strong> {datetime.utcnow().strftime('%d %B %Y')}</p>
        <div class="metric">{report.get('overall_score', 0)}%</div>
        <p>Overall Compliance Score</p>

        <h2>Framework Scores</h2>
        <table><tr><th>Framework</th><th>Score</th></tr>{rows}</table>

        <h2>Gap Analysis</h2>
        {gap_html or '<p>No gaps detected.</p>'}

        <h2>AI Recommendations</h2>
        <p>{rec.get('executive_summary', '')}</p>
        <p><strong>Weaknesses:</strong> {rec.get('compliance_weaknesses', '')}</p>
        <p><strong>Business Impact:</strong> {rec.get('business_impact', '')}</p>
        <ul>{actions}</ul>
        <p><strong>Estimated score after fixes:</strong> {rec.get('estimated_score_after_fixes', 'n/a')}%</p>

        <h2>Summary</h2>
        <p>Highest gap: {summary.get('highest_gap', 'n/a')} |
           Strongest framework: {summary.get('highest_framework', 'n/a')}</p>
    </body>
    </html>
    """
