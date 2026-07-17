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