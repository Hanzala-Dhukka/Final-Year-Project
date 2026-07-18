import json, urllib.request

code = """from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from app.services.threat_model_service import threat_results_store
from app.services.pdf_generator import generate_pdf, get_pdf_path
from app.dependencies.auth import get_current_user
from app.database.db import database
import os

router = APIRouter()

@router.get("/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):
    reports_collection = database["security_reports"]
    query = {}
    if current_user.get("role") != "admin":
        query = {"user_id": current_user["_id"]}
    reports = await reports_collection.find(query).sort("created_at", -1).to_list(length=100)
    result = []
    for report in reports:
        report["_id"] = str(report["_id"])
        if "user_id" in report:
            report["user_id"] = str(report["user_id"])
        result.append({"id": report["_id"], "title": report.get("title", "Untitled Report"), "risk": report.get("risk_level", "Unknown"), "created": report.get("created_at")})
    return result

@router.get("/report/{project_id}")
async def download_report(project_id: str):
    project_data = threat_results_store.get(project_id)
    if not project_data:
        raise HTTPException(status_code=404, detail="Project not found")
    pdf_path = get_pdf_path(project_id, project_data.get("project", "report"))
    if not os.path.exists(pdf_path):
        pdf_path = generate_pdf(project_id, project_data)
    return FileResponse(path=pdf_path, filename=f"{project_data.get('project', 'report')}_Threat_Report.pdf", media_type="application/pdf")
"""

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNmE1YTdmZjUxZjYyMDA4OTAzNTJjMDliIiwicm9sZSI6InN0dWRlbnQiLCJleHAiOjE3ODQ0MDcxNzEsImlhdCI6MTc4NDQwMzU3MSwidHlwZSI6ImFjY2VzcyJ9.HUSIq7Nt9yUPQ8cO4pB1v1NOO2TMjHpSmTcBy9Zlbjg"

body = json.dumps({
    "code": code,
    "language": "python",
    "project_id": "026618c2",
}).encode("utf-8")

req = urllib.request.Request(
    "http://127.0.0.1:8000/api/v1/code-review",
    data=body,
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer " + TOKEN,
    },
    method="POST",
)

try:
    resp = urllib.request.urlopen(req, timeout=90)
    data = json.loads(resp.read().decode())
    print("HTTP", resp.status)
    print("review_id:", data.get("review_id"))
    print("language:", data.get("language"))
    print("risk_score:", data.get("risk_score"))
    print("severity_summary:", data.get("severity_summary"))
    print("findings count:", len(data.get("findings", [])))
    for f in data.get("findings", [])[:5]:
        print("  -", f.get("severity"), f.get("title"), "| line", f.get("line"))
    print("ai_explanation (first 300):", (data.get("ai_explanation") or "")[:300])
    print("secure_code (first 200):", (data.get("secure_code") or "")[:200])
except urllib.error.HTTPError as e:
    print("HTTP ERROR", e.code, e.read().decode()[:500])
except Exception as e:
    print("ERROR:", e)
