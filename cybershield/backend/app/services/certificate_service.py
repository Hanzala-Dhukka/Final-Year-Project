"""
Certificate Service - Certificate Data Management
Generates per-category and professional certificate records for OWASP training.
PDF generation is handled client-side via html2canvas + jsPDF.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
import asyncio
from app.services.error_log_service import fire_and_forget_log

ALL_VULNERABILITY_CATEGORIES = [
    "SQL Injection", "XSS", "Command Injection", "Path Traversal",
    "Broken Authentication", "CSRF", "SSRF", "IDOR", "File Upload",
    "XXE", "Security Misconfiguration", "Insecure Deserialization",
    "JWT Attacks", "API Security", "Rate Limiting",
]

VULNERABILITY_OWASP_MAP = {
    "SQL Injection": "A03:2021 - Injection",
    "XSS": "A03:2021 - Injection",
    "Command Injection": "A03:2021 - Injection",
    "File Upload": "A03:2021 - Injection",
    "Path Traversal": "A01:2021 - Broken Access Control",
    "CSRF": "A01:2021 - Broken Access Control",
    "IDOR": "A01:2021 - Broken Access Control",
    "API Security": "A01:2021 - Broken Access Control",
    "SSRF": "A10:2021 - Server-Side Request Forgery",
    "Broken Authentication": "A07:2021 - Identification and Authentication Failures",
    "JWT Attacks": "A07:2021 - Identification and Authentication Failures",
    "Rate Limiting": "A07:2021 - Identification and Authentication Failures",
    "Security Misconfiguration": "A05:2021 - Security Misconfiguration",
    "XXE": "A05:2021 - Security Misconfiguration",
    "Insecure Deserialization": "A08:2021 - Software and Data Integrity Failures",
}


class CertificateService:
    """Service for generating and managing OWASP certificates."""

    REQUIRED_COMPLETION = 80.0
    REQUIRED_AVERAGE = 75.0
    certificates: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def generate_category_certificate(
        cls, user_id, user_name, vulnerability_type, difficulty, score, labs_completed, total_labs=1
    ):
        cert_id = f"CS-{datetime.now().year}-{vulnerability_type[:3].upper()}-{user_id[:8]}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        owasp_category = VULNERABILITY_OWASP_MAP.get(vulnerability_type, "A03:2021 - Injection")

        cert_data = {
            "certificate_id": cert_id,
            "user_id": user_id,
            "user_name": user_name,
            "vulnerability_type": vulnerability_type,
            "difficulty": difficulty,
            "score": round(score, 1),
            "labs_completed": labs_completed,
            "total_labs": total_labs,
            "owasp_category": owasp_category,
            "date_issued": datetime.now().isoformat(),
            "type": "category",
        }

        try:
            from app.database.db import database
            import pymongo
            database["certificates"].update_one(
                {"user_id": user_id, "vulnerability_type": vulnerability_type},
                {"$set": cert_data},
                upsert=True,
            )
        except Exception as e:
            fire_and_forget_log()
            print(f"Error saving category certificate: {e}")

        cls.certificates[cert_id] = cert_data
        return cert_data

    @classmethod
    def generate_professional_certificate(cls, user_id, user_name, labs_completed=15, average_score=0):
        cert_id = f"CS-{datetime.now().year}-PRO-{user_id[:8]}-{datetime.now().strftime('%Y%m%d%H%M%S')}"

        cert_data = {
            "certificate_id": cert_id,
            "user_id": user_id,
            "user_name": user_name,
            "vulnerability_type": "All OWASP Categories",
            "difficulty": "Expert",
            "score": round(average_score, 1),
            "labs_completed": labs_completed,
            "total_labs": 15,
            "owasp_category": "OWASP Top 10 (2021) - Complete",
            "date_issued": datetime.now().isoformat(),
            "type": "professional",
        }

        try:
            from app.database.db import database
            database["certificates"].update_one(
                {"user_id": user_id, "type": "professional"},
                {"$set": cert_data},
                upsert=True,
            )
        except Exception as e:
            fire_and_forget_log()
            print(f"Error saving professional certificate: {e}")

        cls.certificates[cert_id] = cert_data
        return cert_data

    @classmethod
    def check_category_completion(cls, user_id, vulnerability_type):
        try:
            from app.database.db import database

            async def _count():
                return await database["activity_log"].count_documents({
                    "user_id": user_id,
                    "activity_type": "owasp_lab",
                    "meta.vulnerability": vulnerability_type,
                })

            async def _scores():
                cursor = database["activity_log"].find({
                    "user_id": user_id,
                    "activity_type": "owasp_lab",
                    "meta.vulnerability": vulnerability_type,
                })
                scores = []
                async for doc in cursor:
                    s = (doc.get("meta") or {}).get("score")
                    if s is not None:
                        scores.append(float(s))
                return scores

            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    import concurrent.futures
                    with concurrent.futures.ThreadPoolExecutor() as pool:
                        count = pool.submit(lambda: asyncio.run(_count())).result()
                        scores = pool.submit(lambda: asyncio.run(_scores())).result()
                else:
                    count = loop.run_until_complete(_count())
                    scores = loop.run_until_complete(_scores())
            except RuntimeError:
                count = asyncio.run(_count())
                scores = asyncio.run(_scores())

            avg_score = sum(scores) / len(scores) if scores else 0
            return {
                "completed": count > 0,
                "labs_done": count,
                "total_labs": count,
                "average_score": avg_score,
            }
        except Exception as e:
            fire_and_forget_log()
            print(f"Error checking category completion: {e}")
            return {"completed": False, "labs_done": 0, "total_labs": 0, "average_score": 0}

    @classmethod
    def check_professional_eligibility(cls, user_id):
        try:
            from app.database.db import database

            async def _check():
                completed = []
                for vuln in ALL_VULNERABILITY_CATEGORIES:
                    count = await database["activity_log"].count_documents({
                        "user_id": user_id,
                        "activity_type": "owasp_lab",
                        "meta.vulnerability": vuln,
                    })
                    if count > 0:
                        completed.append(vuln)
                return completed

            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    import concurrent.futures
                    with concurrent.futures.ThreadPoolExecutor() as pool:
                        completed = pool.submit(lambda: asyncio.run(_check())).result()
                else:
                    completed = loop.run_until_complete(_check())
            except RuntimeError:
                completed = asyncio.run(_check())

            all_done = len(completed) >= len(ALL_VULNERABILITY_CATEGORIES)
            return {
                "eligible": all_done,
                "completed_categories": completed,
                "total_categories": len(ALL_VULNERABILITY_CATEGORIES),
                "remaining": [c for c in ALL_VULNERABILITY_CATEGORIES if c not in completed],
            }
        except Exception as e:
            fire_and_forget_log()
            print(f"Error checking professional eligibility: {e}")
            return {
                "eligible": False, "completed_categories": [],
                "total_categories": len(ALL_VULNERABILITY_CATEGORIES),
                "remaining": ALL_VULNERABILITY_CATEGORIES,
            }

    @classmethod
    def get_user_certificates(cls, user_id):
        try:
            from app.database.db import database

            async def _fetch():
                cursor = database["certificates"].find({"user_id": user_id})
                results = []
                async for doc in cursor:
                    doc["certificate_id"] = str(doc.get("_id", doc.get("certificate_id", "")))
                    results.append(doc)
                return results

            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    import concurrent.futures
                    with concurrent.futures.ThreadPoolExecutor() as pool:
                        return pool.submit(lambda: asyncio.run(_fetch())).result()
                else:
                    return loop.run_until_complete(_fetch())
            except RuntimeError:
                return asyncio.run(_fetch())
        except Exception as e:
            fire_and_forget_log()
            print(f"Error fetching certificates: {e}")
            return []

    @classmethod
    def check_eligibility(cls, user_id):
        from app.services.progress_service import ProgressService
        from app.services.analytics_service import AnalyticsService
        progress = ProgressService.get_user_progress(user_id)
        analytics = AnalyticsService.get_learning_analytics(user_id)
        total_labs = analytics.get("total_labs", 10)
        completed_labs = analytics.get("completed_labs", 0)
        completion_pct = (completed_labs / total_labs * 100) if total_labs > 0 else 0
        avg_score = analytics.get("average_score", 0)
        eligible = completion_pct >= cls.REQUIRED_COMPLETION and avg_score >= cls.REQUIRED_AVERAGE
        return {
            "eligible": eligible,
            "reason": "Eligible!" if eligible else f"Need {cls.REQUIRED_COMPLETION}% completion and {cls.REQUIRED_AVERAGE}% average",
            "completion_percentage": round(completion_pct, 1),
            "average_score": avg_score,
            "required_completion": cls.REQUIRED_COMPLETION,
            "required_average": cls.REQUIRED_AVERAGE,
        }

    @classmethod
    def generate_certificate(cls, user_id, user_name="User"):
        eligibility = cls.check_eligibility(user_id)
        if not eligibility["eligible"]:
            return {"certificate": None, "status": "Not Eligible", "eligibility": eligibility}
        from app.services.analytics_service import AnalyticsService
        analytics = AnalyticsService.get_learning_analytics(user_id)
        cert_data = cls.generate_category_certificate(
            user_id=user_id, user_name=user_name,
            vulnerability_type="OWASP Security Training",
            difficulty="Intermediate",
            score=analytics.get("average_score", 0),
            labs_completed=analytics.get("completed_labs", 0),
            total_labs=analytics.get("total_labs", 10),
        )
        return {"certificate": cert_data.get("certificate_id"), "status": "Generated", "eligibility": eligibility, "certificate_data": cert_data}

    @classmethod
    def get_user_certificate(cls, user_id):
        return cls.get_user_certificates(user_id)


def check_certificate_eligibility(user_id):
    return CertificateService.check_eligibility(user_id)

def generate_certificate(user_id, user_name="User"):
    return CertificateService.generate_certificate(user_id, user_name)

def get_certificate(user_id):
    return CertificateService.get_user_certificate(user_id)
