from fastapi import APIRouter
from bson import ObjectId
from app.database.db import database


def _serialize(doc: dict) -> dict:
    """Convert bson types (ObjectId) to JSON-serializable strings."""
    out = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, dict):
            out[k] = _serialize(v)
        elif isinstance(v, list):
            out[k] = [
                _serialize(i) if isinstance(i, dict) else (str(i) if isinstance(i, ObjectId) else i)
                for i in v
            ]
        else:
            out[k] = v
    return out

router = APIRouter()


@router.get("/dashboard-stats")
async def get_dashboard_stats():

    github_collection = database["github_scans"]

    scans = await github_collection.find().to_list(1000)

    total_scans = len(scans)

    total_vulnerabilities = 0

    critical_count = 0
    high_count = 0
    medium_count = 0

    for scan in scans:

        total_vulnerabilities += scan.get(
            "vulnerabilities_found",
            0
        )

        findings = scan.get("findings", [])

        for finding in findings:

            issues = finding.get("issues", [])

            for issue in issues:

                severity = issue.get("severity")

                if severity == "Critical":
                    critical_count += 1

                elif severity == "High":
                    high_count += 1

                elif severity == "Medium":
                    medium_count += 1

    return {
        "total_scans": total_scans,
        "total_vulnerabilities": total_vulnerabilities,
        "critical": critical_count,
        "high": high_count,
        "medium": medium_count
    }


@router.get("/recent-scans")
async def recent_scans():

    github_collection = database["github_scans"]

    scans = await github_collection.find().sort(
        "created_at",
        -1
    ).limit(5).to_list(5)

    return [_serialize(scan) for scan in scans]


#    Executive Security Dashboard (Module 6.4)                                   
import io
import json
from datetime import datetime

from fastapi import Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.dependencies.auth import get_current_user
from app.services import executive_service as svc
from app.services import trend_service


def _uid(current_user: dict) -> str:
    raw = (
        current_user.get("_id")
        or current_user.get("id")
        or current_user.get("sub")
    )
    if not raw:
        raise HTTPException(status_code=401, detail="Could not identify user")
    return str(raw)


@router.get("/summary")
async def summary(
    sort_by: str = Query("security_score"),
    current_user: dict = Depends(get_current_user),
):
    """Full executive dashboard payload (KPIs, trends, comparison, AI summary)."""
    try:
        return await svc.build_dashboard(_uid(current_user), sort_by=sort_by)
    except HTTPException:
        raise
    except Exception as e:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")


@router.get("/trends")
async def trends(current_user: dict = Depends(get_current_user)):
    """Historical security / risk / compliance trend points."""
    try:
        return await trend_service.get_trends(_uid(current_user))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trends error: {str(e)}")


@router.get("/vulnerabilities")
async def vulnerabilities(current_user: dict = Depends(get_current_user)):
    """Vulnerability severity trend points (critical/high/medium/low)."""
    try:
        rows = await trend_service.get_trends(_uid(current_user))
        return [
            {
                "date": r["date"],
                "critical": r.get("critical"),
                "high": r.get("high"),
                "medium": r.get("medium"),
                "low": r.get("low"),
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vulnerability trend error: {str(e)}")


@router.get("/compare")
async def compare(
    sort_by: str = Query("security_score"),
    current_user: dict = Depends(get_current_user),
):
    """Project comparison table, sorted by the given metric."""
    try:
        return await svc.compare_projects(_uid(current_user), sort_by=sort_by)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compare error: {str(e)}")


@router.get("/report")
async def report(current_user: dict = Depends(get_current_user)):
    """Download the executive security dashboard as a PDF."""
    try:
        data = await svc.build_dashboard(_uid(current_user))
        html = _build_report_html(data)
        try:
            from weasyprint import HTML
            pdf = HTML(string=html).write_pdf()
            return StreamingResponse(
                io.BytesIO(pdf),
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=Executive_Security_Report.pdf"},
            )
        except Exception:
            return StreamingResponse(
                io.StringIO(html),
                media_type="text/html",
                headers={"Content-Disposition": "attachment; filename=Executive_Security_Report.html"},
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report error: {str(e)}")


@router.get("/report/json")
async def report_json(current_user: dict = Depends(get_current_user)):
    """Download the executive security dashboard as JSON."""
    try:
        data = await svc.build_dashboard(_uid(current_user))
        return StreamingResponse(
            io.StringIO(json.dumps(data, indent=2, default=str)),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=Executive_Security_Report.json"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report error: {str(e)}")


def _build_report_html(data: dict) -> str:
    k = data.get("kpis", {})
    trends = data.get("trends", [])
    comparison = data.get("comparison", [])
    ai = data.get("ai_summary", {})
    trend_rows = "".join(
        f"<tr><td>{t.get('date')}</td><td>{t.get('security_score')}</td>"
        f"<td>{t.get('compliance_score')}</td>"
        f"<td>{t.get('critical')}</td><td>{t.get('high')}</td></tr>"
        for t in trends
    )
    comp_rows = "".join(
        f"<tr><td>{c.get('name')}</td><td>{c.get('security_score')}</td>"
        f"<td>{c.get('compliance_score')}</td><td>{c.get('risk_level')}</td>"
        f"<td>{c.get('open_vulnerabilities')}</td></tr>"
        for c in comparison
    )
    actions = "".join(f"<li>{a}</li>" for a in (ai.get("priority_actions") or []))
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>CyberShield Executive Security Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; padding: 30px; color:#1f2937; }}
            h1 {{ color:#111827; }}
            h2 {{ border-bottom:2px solid #2563EB; padding-bottom:6px; margin-top:30px; }}
            table {{ width:100%; border-collapse:collapse; margin-top:10px; }}
            th,td {{ border:1px solid #e5e7eb; padding:10px; text-align:left; }}
            th {{ background:#2563EB; color:#fff; }}
            .metric {{ font-size:40px; font-weight:bold; color:#2563EB; }}
        </style>
    </head>
    <body>
        <h1>CyberShield Executive Security Report</h1>
        <p>Generated: {datetime.utcnow().strftime('%d %B %Y')}</p>
        <div class="metric">{k.get('security_score')}%</div>
        <p>Global Security Score &mdash; Risk Level: <b>{k.get('risk_level')}</b></p>

        <h2>Key Metrics</h2>
        <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Compliance</td><td>{k.get('compliance')}%</td></tr>
            <tr><td>Critical Issues</td><td>{k.get('critical')}</td></tr>
            <tr><td>High Issues</td><td>{k.get('high')}</td></tr>
            <tr><td>Open Vulnerabilities</td><td>{k.get('open_vulnerabilities')}</td></tr>
            <tr><td>Projects</td><td>{k.get('projects')}</td></tr>
            <tr><td>Last Scan</td><td>{k.get('last_scan')}</td></tr>
        </table>

        <h2>Security & Compliance Trend</h2>
        <table>
            <tr><th>Date</th><th>Security</th><th>Compliance</th><th>Critical</th><th>High</th></tr>
            {trend_rows}
        </table>

        <h2>Project Comparison</h2>
        <table>
            <tr><th>Project</th><th>Security</th><th>Compliance</th><th>Risk</th><th>Open Vulns</th></tr>
            {comp_rows}
        </table>

        <h2>AI Executive Summary</h2>
        <p>{ai.get('executive_summary','')}</p>
        <p><b>Business Risk:</b> {ai.get('business_risk','')}</p>
        <p><b>Security Outlook:</b> {ai.get('security_outlook','')}</p>
        <ul>{actions}</ul>
    </body>
    </html>
    """