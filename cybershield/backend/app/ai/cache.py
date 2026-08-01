"""
AI Vulnerability Analysis Cache — Module D4

MongoDB-backed cache for AI vulnerability explanations.
Prevents duplicate Groq API calls for the same finding.
"""

import hashlib
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional

from app.database.db import database

CACHE_COLLECTION = "ai_vulnerability_analysis"
CACHE_TTL_HOURS = 48


def _finding_hash(finding: Dict[str, Any]) -> str:
    """Generate a deterministic hash for a vulnerability finding."""
    key_parts = [
        str(finding.get("type", "")),
        str(finding.get("severity", "")),
        str(finding.get("file", "")),
        str(finding.get("code", ""))[:500],
    ]
    raw = "|".join(key_parts)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


async def get_cached_analysis(finding: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Look up a cached AI analysis for this finding."""
    try:
        finding_id = finding.get("finding_id") or _finding_hash(finding)
        doc = await database[CACHE_COLLECTION].find_one({"finding_id": finding_id})
        if not doc:
            return None

        # Check TTL
        expires = doc.get("expires_at")
        if expires:
            if expires.tzinfo is None:
                expires = expires.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > expires:
                await database[CACHE_COLLECTION].delete_one({"_id": doc["_id"]})
                return None

        # Remove MongoDB internal fields
        doc.pop("_id", None)
        return doc
    except Exception:
        return None


async def save_analysis(finding: Dict[str, Any], analysis: Dict[str, Any]) -> None:
    """Store an AI analysis result in MongoDB cache."""
    try:
        finding_id = finding.get("finding_id") or _finding_hash(finding)
        now = datetime.now(timezone.utc)

        document = {
            "finding_id": finding_id,
            "type": finding.get("type", ""),
            "severity": finding.get("severity", ""),
            "file": finding.get("file", ""),
            **analysis,
            "created_at": now,
            "expires_at": now + timedelta(hours=CACHE_TTL_HOURS),
        }

        await database[CACHE_COLLECTION].update_one(
            {"finding_id": finding_id},
            {"$set": document},
            upsert=True,
        )
    except Exception as exc:
        print(f"[AI Cache] Failed to save analysis: {exc}")


async def invalidate_cache(finding_id: str) -> bool:
    """Remove cached analysis for a specific finding."""
    try:
        result = await database[CACHE_COLLECTION].delete_one({"finding_id": finding_id})
        return result.deleted_count > 0
    except Exception:
        return False
