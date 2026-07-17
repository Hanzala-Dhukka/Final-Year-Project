"""
AI Code Review service (Module 5.3).

Pipeline: detect language -> run rule scanner -> call Gemini AI -> store
summary + full report -> support JSON / Markdown / PDF export.
"""
from typing import Optional

from app.database.db import database
from app.models.code_review_model import review_document, report_document
from app.services import ai_code_review as scanner
from app.services.language_detector import resolve_language

reviews = database.code_reviews
reports = database.code_review_reports


def _unique(items: list) -> list:
    seen = []
    for i in items:
        if i and i not in seen:
            seen.append(i)
    return seen


async def review_code(user_id: str, code: str, language_hint: Optional[str],
                      filename: Optional[str] = None, project_id: Optional[str] = None) -> dict:
    """
    Run the full review pipeline and persist results.

    Returns a dict shaped like CodeReviewResponse.
    """
    language = resolve_language(filename, language_hint)
    findings = scanner.scan_rules(code, language)
    ai = await scanner.ai_review(code, language, findings)

    risk_score = scanner.compute_risk_score(findings)
    severity_summary = scanner.severity_counts(findings)
    owasp = _unique([f["owasp"] for f in findings])
    cwe = _unique([f["cwe"] for f in findings])

    review_doc = review_document(
        user_id, language, risk_score, severity_summary, owasp, cwe, project_id
    )
    await reviews.insert_one(review_doc)
    review_id = review_doc["_id"]

    report_doc = report_document(
        review_id, user_id, language, code, findings, ai["ai_explanation"],
        ai["secure_code"], risk_score, severity_summary, owasp, cwe, project_id,
    )
    await reports.insert_one(report_doc)

    return {
        "review_id": review_id,
        "language": language,
        "risk_score": risk_score,
        "severity_summary": severity_summary,
        "owasp": owasp,
        "cwe": cwe,
        "findings": findings,
        "ai_explanation": ai["ai_explanation"],
        "secure_code": ai["secure_code"],
    }


async def list_reviews(user_id: str) -> list:
    """List the user's reviews, newest first."""
    cursor = reviews.find({"user_id": user_id}).sort("created_at", -1)
    out = []
    async for doc in cursor:
        out.append({
            "id": doc["_id"],
            "language": doc.get("language"),
            "risk_score": doc.get("risk_score", 0),
            "severity_summary": doc.get("severity_summary", {}),
            "owasp": doc.get("owasp", []),
            "cwe": doc.get("cwe", []),
            "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else "",
        })
    return out


async def get_report(review_id: str, user_id: str) -> Optional[dict]:
    """Get a full report, verifying ownership. Lookup is by the `review_id` field."""
    doc = await reports.find_one({"review_id": review_id, "user_id": user_id})
    if not doc:
        return None
    return {
        "review_id": doc["_id"],
        "language": doc.get("language"),
        "code": doc.get("code", ""),
        "findings": doc.get("findings", []),
        "ai_explanation": doc.get("ai_explanation", ""),
        "secure_code": doc.get("secure_code", ""),
        "risk_score": doc.get("risk_score", 0),
        "severity_summary": doc.get("severity_summary", {}),
        "owasp": doc.get("owasp", []),
        "cwe": doc.get("cwe", []),
        "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else "",
    }


async def delete_review(review_id: str, user_id: str) -> bool:
    """Delete a review's summary + full report (ownership-checked)."""
    rep = await reports.find_one({"review_id": review_id, "user_id": user_id})
    if not rep:
        return False
    await reports.delete_one({"review_id": review_id})
    await reviews.delete_one({"_id": review_id})
    return True


# ── Exports ──────────────────────────────────────────────────────────────────
def to_markdown(data: dict) -> str:
    """Render a review report as Markdown."""
    lines = [
        "# CyberShield AI Code Review",
        "",
        f"**Language:** {data.get('language')}",
        f"**Risk Score:** {data.get('risk_score')}",
        f"**OWASP:** {', '.join(data.get('owasp', [])) or 'None'}",
        f"**CWE:** {', '.join(data.get('cwe', [])) or 'None'}",
        "",
        "## Severity Summary",
    ]
    for sev, count in data.get("severity_summary", {}).items():
        lines.append(f"- {sev}: {count}")
    lines += ["", "## Vulnerabilities"]
    for f in data.get("findings", []):
        lines.append(f"- Line {f['line']}: **{f['title']}** [{f['severity']}] "
                     f"(OWASP {f['owasp']}, {f['cwe']})")
        lines.append(f"  - {f['recommendation']}")
    lines += ["", "## AI Explanation", "", data.get("ai_explanation", "")]
    if data.get("secure_code"):
        lines += ["", "## Secure Code", "", "```" + data.get("language", "").lower(),
                  data["secure_code"], "```"]
    return "\n".join(lines)


def to_json(data: dict) -> dict:
    """Return the raw report dict for JSON export."""
    return data


def to_html(data: dict) -> str:
    """Render a report as a simple HTML document (for PDF generation)."""
    findings_html = "".join(
        f"<li><b>Line {f['line']}: {f['title']}</b> "
        f"[{f['severity']}] (OWASP {f['owasp']}, {f['cwe']})<br>"
        f"<i>{f['recommendation']}</i></li>"
        for f in data.get("findings", [])
    ) or "<li>No issues detected by static rules.</li>"

    secure = data.get("secure_code", "")
    code_block = (
        f"<pre><code>{secure}</code></pre>" if secure else ""
    )

    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>CyberShield Code Review</title>
<style>
 body{{font-family:Arial,sans-serif;padding:24px;color:#222;}}
 h1{{color:#1a1a1a;border-bottom:2px solid #3b82f6;padding-bottom:8px;}}
 .metric{{display:inline-block;margin:8px 16px;}}
 .metric b{{font-size:24px;color:#3b82f6;}}
 pre{{background:#282c34;color:#abb2bf;padding:12px;border-radius:8px;overflow-x:auto;}}
</style></head><body>
<h1>CyberShield AI Code Review</h1>
<div>
 <span class="metric">Risk Score<b>{data.get('risk_score')}</b></span>
 <span class="metric">Language<b>{data.get('language')}</b></span>
</div>
<p><b>OWASP:</b> {', '.join(data.get('owasp', [])) or 'None'}</p>
<p><b>CWE:</b> {', '.join(data.get('cwe', [])) or 'None'}</p>
<h2>Vulnerabilities</h2>
<ul>{findings_html}</ul>
<h2>AI Explanation</h2>
<p>{data.get('ai_explanation','')}</p>
<h2>Secure Code</h2>
{code_block}
</body></html>"""
