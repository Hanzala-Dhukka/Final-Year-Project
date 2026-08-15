"""
Real-time Dashboard Service (Module C1/C2 — data-only).

Aggregates the CyberShield dashboard EXCLUSIVELY from live MongoDB data.
Every number, chart and list below is computed from the user's real
activity — there are no canned/demo values.

The output keeps the same shape the dashboard front-end already expects
(username, security_score, weekly_scans, vulnerability_trend, ...) so faking
or seeding a "dashboard" collection becomes unnecessary.
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId

from app.database.db import database
from app.services.progress_service import ProgressService

WEEK_DAYS = 7
QUIZ_TOTAL = 30
OWASP_TOTAL = 10
GLOSSARY_TOTAL = 60

ICON_MAP = {
    "wave": "🌊",
    "user": "👤",
    "shield": "🛡️",
    "radar": "📡",
    "crosshair": "🎯",
    "book": "📖",
    "trophy": "🏆",
    "flask": "🧪",
    "fire": "🔥",
    "crown": "👑",
    "lock": "🔒",
    "bug": "🐛",
}


def _valid_oid(value: str) -> Optional[ObjectId]:
    try:
        return ObjectId(value)
    except Exception:
        return None


def _user_filter(user_id: str) -> Dict[str, Any]:
    """Match user_id whether the app stored it as a string or an ObjectId."""
    oid = _valid_oid(user_id)
    if oid:
        return {"$or": [{"user_id": user_id}, {"user_id": oid}]}
    return {"user_id": user_id}


def _parse_dt(value) -> Optional[datetime]:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if not value:
        return None
    raw = str(value).strip()
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except Exception:
        pass
    for fmt in ("%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(raw, fmt).replace(tzinfo=timezone.utc)
        except Exception:
            continue
    return None


def _time_ago(dt: datetime) -> str:
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    secs = int((now - dt).total_seconds())
    if secs < 60:
        return "Just now"
    if secs < 3600:
        return f"{secs // 60} min ago"
    if secs < 86400:
        return f"{secs // 3600} hours ago"
    if secs < 604800:
        return f"{secs // 86400} days ago"
    return f"{secs // 604800} weeks ago"


def _sev_key(severity: Any) -> Optional[str]:
    s = str(severity or "").strip().lower()
    if s in ("critical", "crit", "severe", "critical-high"):
        return "critical"
    if s in ("high", "danger"):
        return "high"
    if s in ("medium", "med", "moderate"):
        return "medium"
    if s in ("low", "info", "informational", "none"):
        return "low"
    return None


def _icon(name: Any) -> str:
    return ICON_MAP.get(str(name or "").lower(), "🏅")


def _week_buckets() -> Dict[str, Dict[str, Any]]:
    now = datetime.now(timezone.utc)
    buckets: Dict[str, Dict[str, Any]] = {}
    for i in range(WEEK_DAYS - 1, -1, -1):
        day = (now - timedelta(days=i)).date()
        buckets[day.isoformat()] = {
            "day": day.strftime("%a"),
            "date": day,
            "count": 0,
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
        }
    return buckets


async def _user_display_name(user_id: str) -> str:
    oid = _valid_oid(user_id)
    user = None
    if oid:
        user = await database.users.find_one({"_id": oid})
    if not user:
        user = await database.users.find_one({"user_id": user_id})
    if not user:
        return "User"
    return (
        user.get("name")
        or user.get("full_name")
        or user.get("username")
        or user.get("email", "").split("@")[0]
        or "User"
    )


def _extract_severities(scan: Dict[str, Any]) -> List[str]:
    """Pull severity values from any known findings field on a scan.

    Strategy (in priority order):
      1. ``severity_summary`` — pre-computed dict {critical, high, medium, low}
         with integer counts.  This is the authoritative source when present
         (written by ``scan_runner.py``).
      2. Individual findings lists — each item may carry a ``severity`` or
         ``risk_level`` or ``risk`` string field.
    """
    # --- 1. Prefer the pre-computed severity_summary dict ----------------
    severity_summary = scan.get("severity_summary")
    if isinstance(severity_summary, dict) and any(
        isinstance(severity_summary.get(k), (int, float)) and severity_summary[k] > 0
        for k in ("critical", "high", "medium", "low")
    ):
        result: List[str] = []
        for sev_name in ("critical", "high", "medium", "low"):
            count = int(severity_summary.get(sev_name, 0) or 0)
            result.extend([sev_name] * count)
        if result:
            return result

    # --- 2. Fall back to extracting from individual finding objects ------
    severities: List[str] = []
    for field in ("vulnerabilities", "findings", "analysis_results", "threats",
                  "results", "dependency_findings"):
        for item in scan.get(field, []) or []:
            if isinstance(item, dict):
                if item.get("severity"):
                    severities.append(item["severity"])
                elif item.get("risk_level"):
                    severities.append(item["risk_level"])
                elif isinstance(item.get("risk"), str):
                    severities.append(item["risk"])
    return severities


def _repo_name(scan: Dict[str, Any]) -> str:
    for field in ("repository", "repository_name", "target_url", "repo_url", "project_name"):
        value = scan.get(field)
        if value:
            return str(value)
    return "Unknown"


async def _collect_scans(user_id: str) -> Dict[str, Any]:
    """Aggregate everything we can learn from the user's real scans.

    Reads both live scan stores used by the app:
      * ``github_scans`` — repository scans from the GitHub Scanner (primary)
      * ``scans``        — website / security-header analyzer scans
    """
    total = 0
    projects: set = set()
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    buckets = _week_buckets()
    recent: List[Dict[str, Any]] = []
    last_scan_dt: Optional[datetime] = None

    def _ingest(scan: Dict[str, Any]) -> None:
        nonlocal total, last_scan_dt
        total += 1
        projects.add(_repo_name(scan))

        dt = _parse_dt(scan.get("created_at"))
        if dt and (last_scan_dt is None or dt > last_scan_dt):
            last_scan_dt = dt

        severities = _extract_severities(scan)
        if not severities:
            top = _sev_key(scan.get("risk_level"))
            if top:
                severities = [top]

        keys = [_sev_key(s) for s in severities]
        keys = [k for k in keys if k]
        if not keys:
            keys = ["low"]

        for key in keys:
            counts[key] += 1
            if dt and dt.date().isoformat() in buckets:
                buckets[dt.date().isoformat()][key] += 1

        if dt and dt.date().isoformat() in buckets:
            buckets[dt.date().isoformat()]["count"] += 1

        if len(recent) < 5:
            recent.append({
                "id": str(scan.get("_id", "")),
                "repository": _repo_name(scan),
                "risk_level": scan.get("risk_level", "Medium"),
                "files": (
                    scan.get("files_scanned")
                    or scan.get("scanned_files")
                    or len(scan.get("findings", []) or [])
                    or 0
                ),
                "date": dt.strftime("%Y-%m-%d") if dt else "",
                "status": scan.get("status", "Completed"),
            })

    try:
        for collection_name in ("github_scans", "scans"):
            try:
                cursor = database[collection_name].find(_user_filter(user_id)).sort("created_at", -1)
                async for scan in cursor:
                    _ingest(scan)
            except Exception as e:
                print(f"[realtime] {collection_name} aggregation error: {e}")
    except Exception as e:
        print(f"[realtime] scan aggregation error: {e}")

    weekly_scans = [{"day": b["day"], "count": b["count"]} for b in buckets.values()]
    vulnerability_trend = [
        {
            "day": b["day"],
            "critical": b["critical"],
            "high": b["high"],
            "medium": b["medium"],
            "low": b["low"],
        }
        for b in buckets.values()
    ]

    return {
        "total": total,
        "projects": len(projects),
        "counts": counts,
        "weekly_scans": weekly_scans,
        "vulnerability_trend": vulnerability_trend,
        "recent": recent,
        "last_scan_dt": last_scan_dt,
    }


async def _collect_projects(user_id: str) -> int:
    """Count the user's real projects (via memberships) — matches the Projects page."""
    count = 0
    try:
        async for m in database.project_members.find({"user_id": user_id}):
            if ObjectId.is_valid(m.get("project_id", "")):
                count += 1
    except Exception as e:
        print(f"[realtime] project aggregation error: {e}")
    return count


async def _collect_reports(user_id: str) -> Dict[str, Any]:
    reports: List[Dict[str, Any]] = []
    try:
        cursor = database.threat_reports.find(_user_filter(user_id)).sort("created_at", -1)
        async for report in cursor:
            dt = _parse_dt(report.get("created_at"))
            if len(reports) < 5:
                reports.append({
                    "id": str(report.get("_id", "")),
                    "project": report.get("project_name", "Unknown"),
                    "risk": report.get("risk_level", "Medium"),
                    "score": report.get("security_score", report.get("risk_score", 0)),
                    "created": dt.strftime("%Y-%m-%d") if dt else "",
                })
    except Exception as e:
        print(f"[realtime] report aggregation error: {e}")
    return {"total": len(reports), "recent": reports}


async def _collect_quiz(user_id: str) -> Dict[str, Any]:
    scores: List[int] = []
    weekly_scores: List[int] = []
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    try:
        cursor = database.quiz_attempts.find(_user_filter(user_id))
        async for quiz in cursor:
            score = int(quiz.get("percentage", quiz.get("score", 0)) or 0)
            scores.append(score)
            dt = _parse_dt(quiz.get("created_at"))
            if dt and dt >= week_ago:
                weekly_scores.append(score)
    except Exception as e:
        print(f"[realtime] quiz aggregation error: {e}")

    return {
        "completed_quizzes": len(scores),
        "average_score": int(sum(scores) / len(scores)) if scores else 0,
        "highest_score": max(scores) if scores else 0,
        "weekly_scores": weekly_scores,
        "total": len(scores),
    }


async def _collect_learning(user_id: str) -> Dict[str, Any]:
    glossary_percent = 0
    owasp_percent = 0
    try:
        gp = await database.glossary_progress.find_one(_user_filter(user_id))
        if gp:
            learned = len(gp.get("terms_learned", []) or [])
            glossary_percent = min(100, round(learned / GLOSSARY_TOTAL * 100))

        owasp_completed = await database.owasp_sessions.count_documents(
            {**_user_filter(user_id), "status": "completed"}
        )
        owasp_percent = min(100, round(owasp_completed / OWASP_TOTAL * 100))

        quiz = await _collect_quiz(user_id)
        quiz_percent = min(100, round(quiz["total"] / QUIZ_TOTAL * 100))

        overall = round((glossary_percent + owasp_percent + quiz_percent) / 3)
        return {
            "glossary": glossary_percent,
            "owasp": owasp_percent,
            "quiz": quiz_percent,
            "overall": overall,
        }
    except Exception as e:
        print(f"[realtime] learning aggregation error: {e}")
        return {"glossary": 0, "owasp": 0, "quiz": 0, "overall": 0}


async def _collect_progress(user_id: str) -> Dict[str, Any]:
    """Real XP/level from event log (falls back to the progress collection)."""
    xp = 0
    try:
        async for log in database.activity_log.find(_user_filter(user_id)):
            xp += int(log.get("xp", 0) or 0)
    except Exception as e:
        print(f"[realtime] activity xp error: {e}")

    if xp == 0:
        try:
            async for prog in database.user_progress.find(_user_filter(user_id)):
                xp = max(xp, int(prog.get("xp", 0) or 0))
        except Exception as e:
            print(f"[realtime] progress xp error: {e}")

    level = ProgressService.calculate_level(xp)
    remaining = ProgressService.get_xp_to_next_level(xp)
    next_level_xp = xp + remaining
    rank = ProgressService.LEVEL_TITLES.get(level, "Learner")
    return {"xp": xp, "level": level, "next_level_xp": next_level_xp, "rank": rank}


async def _collect_achievements(user_id: str) -> List[Dict[str, Any]]:
    """Real achievement catalogue with each row's true unlocked state.

    The catalogue comes from the authoritative AchievementService definitions
    and unlocked state is read from the user's own achievement records.
    """
    unlocked_keys: set = set()
    try:
        from app.services.gamification_service import _unlock_all
        await _unlock_all(user_id)
        async for doc in database.achievements.find(_user_filter(user_id)):
            key = doc.get("key")
            if key:
                unlocked_keys.add(str(key))
    except Exception as e:
        print(f"[realtime] badge aggregation error: {e}")

    try:
        from app.services.achievement_service import AchievementService
        result: List[Dict[str, Any]] = []
        for key, defn in AchievementService.ACHIEVEMENTS.items():
            result.append({
                "id": key,
                "title": defn.get("name") or key.replace("_", " ").title(),
                "description": defn.get("description") or "Earn this achievement",
                "icon": defn.get("icon") or "🏅",
                "unlocked": key in unlocked_keys,
            })
        return result[:12]
    except Exception as e:
        print(f"[realtime] achievement catalogue error: {e}")

    if unlocked_keys:
        return [
            {
                "id": str(idx),
                "title": name.replace("_", " ").title(),
                "description": "Earned achievement",
                "icon": "🏅",
                "unlocked": True,
            }
            for idx, name in enumerate(sorted(unlocked_keys)[:6], start=1)
        ]
    return []


async def _collect_activity(user_id: str, last_scan_dt: Optional[datetime], threats_total: int, quiz_total: int) -> List[Dict[str, Any]]:
    type_map = {
        "quiz": "quiz",
        "owasp_lab": "lab",
        "badge": "achievement",
        "scan": "scan",
        "threat": "threat",
        "challenge": "challenge",
    }
    activities: List[Dict[str, Any]] = []
    try:
        cursor = database.activity_log.find(_user_filter(user_id)).sort("created_at", -1).limit(8)
        async for log in cursor:
            dt = _parse_dt(log.get("created_at"))
            a_type = type_map.get(str(log.get("activity_type", "")).lower(), "scan")
            activities.append({
                "title": log.get("description", "Activity"),
                "time": dt.strftime("%I:%M %p") if dt else "",
                "timestamp": _time_ago(dt) if dt else "Recently",
                "type": a_type,
            })
    except Exception as e:
        print(f"[realtime] activity log error: {e}")

    if not activities:
        # Build an honest feed from the latest real events the user has.
        try:
            for collection_name in ("github_scans", "scans"):
                scan = await database[collection_name].find_one(
                    _user_filter(user_id), sort=[("created_at", -1)]
                )
                if scan:
                    dt = _parse_dt(scan.get("created_at"))
                    activities.append({
                        "title": f"Repository scanned: {_repo_name(scan)}",
                        "time": dt.strftime("%I:%M %p") if dt else "",
                        "timestamp": _time_ago(dt) if dt else "Recently",
                        "type": "scan",
                    })
            quiz = await database.quiz_attempts.find_one(_user_filter(user_id), sort=[("created_at", -1)])
            if quiz:
                dt = _parse_dt(quiz.get("created_at"))
                score = quiz.get("percentage", 0)
                activities.append({
                    "title": f"Quiz completed: {score}%",
                    "time": dt.strftime("%I:%M %p") if dt else "",
                    "timestamp": _time_ago(dt) if dt else "Recently",
                    "type": "quiz",
                })
            report = await database.threat_reports.find_one(_user_filter(user_id), sort=[("created_at", -1)])
            if report:
                dt = _parse_dt(report.get("created_at"))
                activities.append({
                    "title": f"Threat report: {report.get('project_name', 'Project')}",
                    "time": dt.strftime("%I:%M %p") if dt else "",
                    "timestamp": _time_ago(dt) if dt else "Recently",
                    "type": "threat",
                })
        except Exception as e:
            print(f"[realtime] activity fallback error: {e}")

    return activities[:5]


async def _collect_daily_challenge(user_id: str) -> Optional[Dict[str, Any]]:
    try:
        today = datetime.now(timezone.utc).date().isoformat()
        challenge = await database.daily_challenges.find_one({"date": today})
        if not challenge:
            challenge = await database.daily_challenges.find_one(sort=[("date", -1)])
        if not challenge:
            return None

        completed_by = challenge.get("completed_by", []) or []
        completed = any(str(x) == user_id for x in completed_by)
        return {
            "title": challenge.get("vulnerability", "Daily Challenge"),
            "description": f"Practice defending against {challenge.get('vulnerability', 'a security')} attacks.",
            "difficulty": challenge.get("difficulty", "Medium"),
            "reward": challenge.get("reward_xp", challenge.get("reward", 50)),
            "completed": completed,
        }
    except Exception as e:
        print(f"[realtime] daily challenge error: {e}")
        return None


def _build_ai_insight(scan_counts: Dict[str, int], total_scans: int, quiz: Dict[str, Any], xp: int) -> Optional[Dict[str, Any]]:
    if scan_counts["critical"] + scan_counts["high"] + scan_counts["medium"] == 0 and total_scans == 0:
        return {
            "title": "Run your first scan",
            "description": "Scan a repository to start tracking your security posture with real data.",
            "priority": "Medium",
        }

    if scan_counts["critical"] > 0:
        return {
            "title": f"{scan_counts['critical']} critical finding{'s' if scan_counts['critical'] > 1 else ''} detected",
            "description": f"You currently have {scan_counts['critical']} critical and {scan_counts['high']} high severity issues open. Prioritize remediation using the scanner results.",
            "priority": "High",
        }
    if scan_counts["high"] > 0:
        return {
            "title": f"{scan_counts['high']} high severity issue{'s' if scan_counts['high'] > 1 else ''} to resolve",
            "description": "Reducing high severity findings will meaningfully improve your overall security score.",
            "priority": "High",
        }
    if total_scans > 0:
        return {
            "title": "No critical threats detected",
            "description": "Your latest scans show no critical or high severity issues. Keep scanning new repositories and completing quizzes to maintain this.",
            "priority": "Low",
        }
    if quiz["completed_quizzes"] > 0:
        return {
            "title": "Keep building your security knowledge",
            "description": f"You have completed {quiz['completed_quizzes']} quiz field(s). Continue learning to unlock more achievements.",
            "priority": "Medium",
        }
    return {
        "title": "Your dashboard is ready",
        "description": "Everything shown here is computed from your real activity. Complete scans, quizzes and labs to see it grow.",
        "priority": "Medium",
    }


async def build_realtime_dashboard(user_id: str) -> Dict[str, Any]:
    """Compile the full dashboard payload from live data only."""
    username = await _user_display_name(user_id)

    scans = await _collect_scans(user_id)
    reports = await _collect_reports(user_id)
    quiz = await _collect_quiz(user_id)
    learning = await _collect_learning(user_id)
    progress = await _collect_progress(user_id)
    achievements = await _collect_achievements(user_id)
    project_count = await _collect_projects(user_id)

    security_score = None
    try:
        doc = await database.security_score.find_one(_user_filter(user_id))
        if doc and doc.get("score") is not None:
            security_score = int(doc.get("score"))
    except Exception as e:
        print(f"[realtime] security score error: {e}")

    if security_score is None:
        counts = scans["counts"]
        if scans["total"] == 0 and quiz["total"] == 0 and reports["total"] == 0:
            security_score = 0
        else:
            security_score = max(
                0,
                min(
                    100,
                    100
                    - counts["critical"] * 10
                    - counts["high"] * 6
                    - counts["medium"] * 3
                    - counts["low"] * 1
                    + min(quiz["total"] * 0.5, 5),
                ),
            )

    activity = await _collect_activity(user_id, scans["last_scan_dt"], reports["total"], quiz["total"])
    daily_challenge = await _collect_daily_challenge(user_id)

    last_scan_time = scans["last_scan_dt"].strftime("%I:%M %p") if scans["last_scan_dt"] else None

    return {
        "user_id": user_id,
        "username": username,
        "security_score": int(security_score),
        "projects": project_count or scans["projects"],
        "scans": scans["total"],
        "threats": reports["total"],
        "critical": scans["counts"]["critical"],
        "high": scans["counts"]["high"],
        "medium": scans["counts"]["medium"],
        "low": scans["counts"]["low"],
        "weekly_scans": scans["weekly_scans"],
        "vulnerability_trend": scans["vulnerability_trend"],
        "learning_progress": learning["overall"],
        "learning_progress_detail": {
            "glossary": learning["glossary"],
            "owasp": learning["owasp"],
            "quiz": learning["quiz"],
        },
        "xp": progress["xp"],
        "rank": progress["rank"],
        "level": progress["level"],
        "next_level_xp": progress["next_level_xp"],
        "achievements": achievements,
        "ai_insight": _build_ai_insight(scans["counts"], scans["total"], quiz, progress["xp"]),
        "recent_activity": activity,
        "last_scan_time": last_scan_time,
        "updated_at": datetime.now(timezone.utc).strftime("%I:%M %p"),
        "recent_scans": scans["recent"],
        "recent_reports": reports["recent"],
        "quiz_progress": {
            "completed_quizzes": quiz["total"],
            "average_score": quiz["average_score"],
            "highest_score": quiz["highest_score"],
            "weekly_scores": quiz["weekly_scores"],
        },
        "daily_challenge": daily_challenge,
        "stats": {
            "security_score": int(security_score),
            "total_scans": scans["total"],
            "threat_reports": reports["total"],
            "quiz_accuracy": quiz["average_score"],
        },
    }