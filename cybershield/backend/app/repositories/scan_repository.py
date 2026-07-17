from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.core.database import get_collection
from app.models.scan_model import ScanModel, VulnerabilityModel, ScanProgressModel, ScanReportModel, SecurityScoreModel

class ScanRepository:
    def __init__(self):
        self.scans_collection = get_collection("scans")
        self.vulnerabilities_collection = get_collection("vulnerabilities")
        self.scan_progress_collection = get_collection("scan_progress")
        self.scan_reports_collection = get_collection("scan_reports")
        self.security_scores_collection = get_collection("security_scores")

    # Scan operations
    async def create_scan(self, scan: Dict[str, Any]) -> str:
        result = await self.scans_collection.insert_one(scan)
        return str(result.inserted_id)

    async def get_scan_by_id(self, scan_id: str) -> Optional[Dict[str, Any]]:
        scan = await self.scans_collection.find_one({"_id": ObjectId(scan_id)})
        if scan:
            scan["_id"] = str(scan["_id"])
        return scan

    async def get_scans_by_user(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        scans = []
        cursor = self.scans_collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        async for scan in cursor:
            scan["_id"] = str(scan["_id"])
            scans.append(scan)
        return scans

    async def update_scan(self, scan_id: str, update_data: Dict[str, Any]) -> bool:
        result = await self.scans_collection.update_one(
            {"_id": ObjectId(scan_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0

    async def delete_scan(self, scan_id: str) -> bool:
        result = await self.scans_collection.delete_one({"_id": ObjectId(scan_id)})
        return result.deleted_count > 0

    # Vulnerability operations
    async def create_vulnerability(self, vulnerability: Dict[str, Any]) -> str:
        result = await self.vulnerabilities_collection.insert_one(vulnerability)
        return str(result.inserted_id)

    async def get_vulnerabilities_by_scan(self, scan_id: str) -> List[Dict[str, Any]]:
        vulnerabilities = []
        cursor = self.vulnerabilities_collection.find({"scan_id": scan_id})
        async for vuln in cursor:
            vuln["_id"] = str(vuln["_id"])
            vulnerabilities.append(vuln)
        return vulnerabilities

    async def search_vulnerabilities(self, scan_id: str, query: str) -> List[Dict[str, Any]]:
        vulnerabilities = []
        cursor = self.vulnerabilities_collection.find({
            "scan_id": scan_id,
            "$or": [
                {"type": {"$regex": query, "$options": "i"}},
                {"evidence": {"$regex": query, "$options": "i"}},
                {"file": {"$regex": query, "$options": "i"}}
            ]
        })
        async for vuln in cursor:
            vuln["_id"] = str(vuln["_id"])
            vulnerabilities.append(vuln)
        return vulnerabilities

    async def get_vulnerabilities_by_severity(self, scan_id: str, severity: str) -> List[Dict[str, Any]]:
        vulnerabilities = []
        cursor = self.vulnerabilities_collection.find({
            "scan_id": scan_id,
            "severity": severity
        })
        async for vuln in cursor:
            vuln["_id"] = str(vuln["_id"])
            vulnerabilities.append(vuln)
        return vulnerabilities

    # Progress operations
    async def create_or_update_progress(self, progress: Dict[str, Any]) -> bool:
        result = await self.scan_progress_collection.update_one(
            {"scan_id": progress["scan_id"]},
            {"$set": progress},
            upsert=True
        )
        return result.modified_count > 0 or result.upserted_id is not None

    async def get_progress(self, scan_id: str) -> Optional[Dict[str, Any]]:
        progress = await self.scan_progress_collection.find_one({"scan_id": scan_id})
        if progress:
            progress["_id"] = str(progress["_id"])
        return progress

    # Report operations
    async def create_report(self, report: Dict[str, Any]) -> str:
        result = await self.scan_reports_collection.insert_one(report)
        return str(result.inserted_id)

    async def get_report_by_scan(self, scan_id: str) -> Optional[Dict[str, Any]]:
        report = await self.scan_reports_collection.find_one({"scan_id": scan_id})
        if report:
            report["_id"] = str(report["_id"])
        return report

    # Security score operations
    async def create_security_score(self, score: Dict[str, Any]) -> str:
        result = await self.security_scores_collection.insert_one(score)
        return str(result.inserted_id)

    async def get_security_scores_by_user(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        scores = []
        cursor = self.security_scores_collection.find({"user_id": user_id}).sort("date", -1).limit(limit)
        async for score in cursor:
            score["_id"] = str(score["_id"])
            scores.append(score)
        return scores

    async def get_latest_score(self, user_id: str, repo: str) -> Optional[Dict[str, Any]]:
        score = await self.security_scores_collection.find_one(
            {"user_id": user_id, "repo": repo},
            sort=[("date", -1)]
        )
        if score:
            score["_id"] = str(score["_id"])
        return score

    # Comparison operations
    async def compare_scans(self, old_scan_id: str, new_scan_id: str) -> Dict[str, Any]:
        old_scan = await self.get_scan_by_id(old_scan_id)
        new_scan = await self.get_scan_by_id(new_scan_id)

        if not old_scan or not new_scan:
            return None

        old_vulns = await self.get_vulnerabilities_by_scan(old_scan_id)
        new_vulns = await self.get_vulnerabilities_by_scan(new_scan_id)

        # Compare vulnerabilities
        old_vuln_set = {(v["file"], v["line"], v["type"]) for v in old_vulns}
        new_vuln_set = {(v["file"], v["line"], v["type"]) for v in new_vulns}

        fixed = old_vuln_set - new_vuln_set
        new_issues = new_vuln_set - old_vuln_set

        improvement = old_scan.get("risk_score", 0) - new_scan.get("risk_score", 0)

        # Convert MongoDB ObjectId to string so the response is JSON-serializable
        old_scan = dict(old_scan)
        new_scan = dict(new_scan)
        old_scan["_id"] = str(old_scan.get("_id"))
        new_scan["_id"] = str(new_scan.get("_id"))

        return {
            "old_scan": old_scan,
            "new_scan": new_scan,
            "improvement": improvement,
            "fixed_count": len(fixed),
            "new_count": len(new_issues),
            "fixed_vulnerabilities": [{"file": f[0], "line": f[1], "type": f[2]} for f in fixed],
            "new_vulnerabilities": [{"file": f[0], "line": f[1], "type": f[2]} for f in new_issues]
        }

# Singleton instance
scan_repository = ScanRepository()