"""
Dashboard service for aggregating user data from multiple collections.
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId
from app.database.db import database


async def get_dashboard(user_id: str) -> Dict[str, Any]:
    """
    Get complete dashboard data for user.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        
    Returns:
        Complete dashboard data matching DashboardResponse schema
    """
    try:
        # Get user info
        user = await database.users.find_one({"_id": user_id})
        if not user:
            return {}
        
        # Calculate security score
        security_score = await calculate_security_score(user_id)
        
        # Get recent scans
        recent_scans = await get_recent_scans(user_id)
        
        # Get recent reports
        recent_reports = await get_recent_reports(user_id)
        
        # Get quiz progress
        quiz_progress = await get_quiz_progress(user_id)
        
        # Get learning progress
        learning_progress = await get_learning_progress(user_id)
        
        # Get recent activity
        recent_activity = await get_recent_activity(user_id)
        
        # Get daily challenge
        daily_challenge = await get_daily_challenge(user_id)
        
        # Get stats
        total_scans = await database.scans.count_documents({"user_id": user_id})
        threat_reports = await database.threat_reports.count_documents({"user_id": user_id})
        
        return {
            "user": {
                "full_name": user.get("full_name", "User"),
                "profile_image": user.get("profile_image")
            },
            "stats": {
                "security_score": security_score,
                "total_scans": total_scans,
                "threat_reports": threat_reports,
                "quiz_accuracy": quiz_progress.get("average_score", 0)
            },
            "recent_scans": recent_scans,
            "recent_reports": recent_reports,
            "recent_activity": recent_activity,
            "quiz_progress": quiz_progress,
            "learning_progress": learning_progress,
            "daily_challenge": daily_challenge
        }
        
    except Exception as e:
        print(f"Error getting dashboard data: {e}")
        import traceback
        traceback.print_exc()
        return {}


async def calculate_security_score(user_id: str) -> int:
    """
    Calculate security score based on vulnerabilities and activities.
    
    Formula:
    Start Score = 100
    - Critical × 10
    - High × 6
    - Medium × 3
    - Low × 1
    + Completed Quiz Bonus
    + Completed Challenge Bonus
    
    Args:
        user_id: User's MongoDB ObjectId as string
        
    Returns:
        Security score (0-100)
    """
    try:
        score = 100
        
        # Count vulnerabilities by severity from scans
        critical = 0
        high = 0
        medium = 0
        low = 0
        
        async for scan in database.scans.find({"user_id": user_id}):
            vulnerabilities = scan.get("vulnerabilities", [])
            for vuln in vulnerabilities:
                severity = vuln.get("severity", "low").lower()
                if severity == "critical":
                    critical += 1
                elif severity == "high":
                    high += 1
                elif severity == "medium":
                    medium += 1
                elif severity == "low":
                    low += 1
        
        # Deduct points for vulnerabilities
        score -= (critical * 10) + (high * 6) + (medium * 3) + (low * 1)
        
        # Add bonus for completed quizzes (max 5 points)
        quiz_count = await database.quiz_attempts.count_documents({
            "user_id": user_id,
            "status": "completed"
        })
        score += min(quiz_count * 0.5, 5)
        
        # Add bonus for completed challenges (max 5 points)
        challenge_count = await database.daily_challenges.count_documents({
            "user_id": user_id,
            "completed": True
        })
        score += min(challenge_count * 0.5, 5)
        
        # Ensure score is between 0 and 100
        return max(0, min(100, int(score)))
        
    except Exception as e:
        print(f"Error calculating security score: {e}")
        return 0


async def get_recent_scans(user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Get recent security scans.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        limit: Maximum number of scans to return
        
    Returns:
        List of recent scans
    """
    try:
        scans = []
        async for scan in database.scans.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit):
            vulnerabilities = scan.get("vulnerabilities", [])
            risk_level = "Low"
            if any(v.get("severity") == "critical" for v in vulnerabilities):
                risk_level = "Critical"
            elif any(v.get("severity") == "high" for v in vulnerabilities):
                risk_level = "High"
            elif any(v.get("severity") == "medium" for v in vulnerabilities):
                risk_level = "Medium"
            
            created_at = scan.get("created_at", datetime.utcnow())
            
            scans.append({
                "id": str(scan["_id"]),
                "repository": scan.get("repository_name", "Unknown"),
                "risk_level": risk_level,
                "files": scan.get("files_scanned", 0),
                "date": created_at.strftime("%Y-%m-%d"),
                "status": scan.get("status", "Completed")
            })
        
        return scans
    except Exception as e:
        print(f"Error getting recent scans: {e}")
        return []


async def get_recent_reports(user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Get recent threat reports.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        limit: Maximum number of reports to return
        
    Returns:
        List of recent reports
    """
    try:
        reports = []
        async for report in database.threat_reports.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit):
            created_at = report.get("created_at", datetime.utcnow())
            
            reports.append({
                "id": str(report["_id"]),
                "project": report.get("project_name", "Unknown"),
                "risk": report.get("risk_level", "Medium"),
                "score": report.get("security_score", 0),
                "created": created_at.strftime("%Y-%m-%d")
            })
        
        return reports
    except Exception as e:
        print(f"Error getting recent reports: {e}")
        return []


async def get_quiz_progress(user_id: str) -> Dict[str, Any]:
    """
    Get quiz progress for user.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        
    Returns:
        Quiz progress data
    """
    try:
        scores = []
        badges = []
        
        async for quiz in database.quiz_attempts.find({"user_id": user_id}):
            score = quiz.get("score", 0)
            scores.append(score)
            
            if score >= 90:
                badges.append("Expert")
            elif score >= 75:
                badges.append("Advanced")
            elif score >= 60:
                badges.append("Intermediate")
        
        # Calculate weekly scores (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        weekly_scores = []
        async for quiz in database.quiz_attempts.find({
            "user_id": user_id,
            "completed_at": {"$gte": week_ago}
        }):
            weekly_scores.append(quiz.get("score", 0))
        
        return {
            "completed_quizzes": len(scores),
            "average_score": int(sum(scores) / len(scores)) if scores else 0,
            "highest_score": max(scores) if scores else 0,
            "badges": list(set(badges)),
            "weekly_scores": weekly_scores
        }
    except Exception as e:
        print(f"Error getting quiz progress: {e}")
        return {
            "completed_quizzes": 0,
            "average_score": 0,
            "highest_score": 0,
            "badges": [],
            "weekly_scores": []
        }


async def get_learning_progress(user_id: str) -> Dict[str, Any]:
    """
    Get learning progress percentages.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        
    Returns:
        Learning progress data with percentages
    """
    try:
        # Glossary progress
        total_glossary = 100  # Assuming 100 total terms
        learned_glossary = await database.glossary_progress.count_documents({
            "user_id": user_id,
            "learned": True
        })
        glossary_percent = min(100, int((learned_glossary / total_glossary) * 100))
        
        # OWASP progress
        total_owasp = 10  # Assuming 10 labs
        completed_owasp = await database.owasp_sessions.count_documents({
            "user_id": user_id,
            "status": "completed"
        })
        owasp_percent = min(100, int((completed_owasp / total_owasp) * 100))
        
        # Quiz progress
        total_quiz = 20  # Assuming 20 quizzes
        completed_quiz = await database.quiz_attempts.count_documents({
            "user_id": user_id
        })
        quiz_percent = min(100, int((completed_quiz / total_quiz) * 100))
        
        return {
            "glossary": glossary_percent,
            "owasp": owasp_percent,
            "quiz": quiz_percent
        }
    except Exception as e:
        print(f"Error getting learning progress: {e}")
        return {
            "glossary": 0,
            "owasp": 0,
            "quiz": 0
        }


async def get_recent_activity(user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get recent activity timeline.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        limit: Maximum number of activities to return
        
    Returns:
        List of recent activities
    """
    try:
        activities = []
        
        # Get recent scans
        async for scan in database.scans.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(3):
            created_at = scan.get("created_at", datetime.utcnow())
            activities.append({
                "date": created_at.strftime("%Y-%m-%d"),
                "action": f"Repository Scanned: {scan.get('repository_name', 'Unknown')}",
                "time": created_at.strftime("%H:%M")
            })
        
        # Get recent quiz attempts
        async for quiz in database.quiz_attempts.find(
            {"user_id": user_id}
        ).sort("completed_at", -1).limit(3):
            completed_at = quiz.get("completed_at", datetime.utcnow())
            activities.append({
                "date": completed_at.strftime("%Y-%m-%d"),
                "action": f"Quiz Completed: {quiz.get('score', 0)}%",
                "time": completed_at.strftime("%H:%M")
            })
        
        # Get recent OWASP sessions
        async for lab in database.owasp_sessions.find(
            {"user_id": user_id, "status": "completed"}
        ).sort("completed_at", -1).limit(2):
            completed_at = lab.get("completed_at", datetime.utcnow())
            activities.append({
                "date": completed_at.strftime("%Y-%m-%d"),
                "action": f"OWASP Lab Completed: {lab.get('lab_name', 'Lab')}",
                "time": completed_at.strftime("%H:%M")
            })
        
        # Sort by date and limit
        activities.sort(key=lambda x: x["date"], reverse=True)
        return activities[:limit]
    except Exception as e:
        print(f"Error getting recent activity: {e}")
        return []


async def get_daily_challenge(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get today's daily challenge.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        
    Returns:
        Daily challenge data or None
    """
    try:
        today = datetime.utcnow().date()
        
        challenge = await database.daily_challenges.find_one({
            "user_id": user_id,
            "date": today.isoformat()
        })
        
        if challenge:
            return {
                "title": challenge.get("title", "Daily Challenge"),
                "description": challenge.get("description", ""),
                "difficulty": challenge.get("difficulty", "Medium"),
                "reward": challenge.get("reward", 50),
                "completed": challenge.get("completed", False)
            }
        
        # Return a default challenge if none exists
        return {
            "title": "SQL Injection Challenge",
            "description": "Identify and fix SQL injection vulnerabilities",
            "difficulty": "Medium",
            "reward": 50,
            "completed": False
        }
    except Exception as e:
        print(f"Error getting daily challenge: {e}")
        return None