"""
Dashboard routes for aggregating all user data in one place.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any, List
from app.utils.security import get_current_user
from app.services.profile_service import profile_service
from app.services.security_score_service import security_score_service
from app.repositories.progress_repository import progress_repository
from app.repositories.lab_repository import lab_repository
from app.repositories.quiz_repository import quiz_repository
from app.repositories.challenge_repository import challenge_repository
from app.repositories.github_repository import github_repository
from app.repositories.security_report_repository import security_report_repository
from app.repositories.owasp_repository import owasp_repository
from app.repositories.chat_repository import chat_repository

router = APIRouter()


@router.get("/dashboard/{user_id}")
async def get_dashboard(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get complete dashboard data for a user.
    
    Aggregates data from all modules into a single response.
    
    Returns:
        Complete dashboard data
    """
    try:
        # Verify user can access this dashboard
        if str(current_user["_id"]) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Fetch all dashboard components in parallel
        profile_data = await profile_service.get_user_profile(user_id)
        security_score = await security_score_service.get_security_score(user_id)
        progress = await progress_repository.get_progress_by_user(user_id)
        
        # Get scan history
        scan_history = await github_repository.get_scans_by_user(user_id, limit=10)
        
        # Get threat reports
        threat_reports = await security_report_repository.get_reports_by_user(user_id, limit=10)
        
        # Get lab progress
        lab_attempts = await lab_repository.get_lab_attempts_by_user(user_id, limit=100)
        completed_labs = [lab for lab in lab_attempts if lab.get("status") == "completed"]
        
        # Get quiz statistics
        quiz_attempts = await quiz_repository.get_quiz_attempts_by_user(user_id, limit=100)
        quiz_stats = _calculate_quiz_statistics(quiz_attempts)
        
        # Get glossary progress
        glossary_progress = await _get_glossary_progress(user_id)
        
        # Get AI chat history
        chat_history = await chat_repository.get_chats_by_user(user_id, limit=10)
        
        # Get achievements
        achievements = progress.get("achievements", []) if progress else []
        
        # Get certificates
        certificates = progress.get("certificates", []) if progress else []
        
        # Get daily challenge
        daily_challenge = await challenge_repository.get_today_challenge(user_id)
        
        # Get OWASP simulation progress
        owasp_attempts = await owasp_repository.get_attempts_by_user(user_id, limit=100)
        
        # Compile dashboard
        dashboard = {
            "user_id": user_id,
            "profile": {
                "username": profile_data.get("username") if profile_data else current_user.get("name"),
                "email": profile_data.get("email") if profile_data else current_user.get("email"),
                "role": profile_data.get("role") if profile_data else current_user.get("role", "student"),
                "full_name": profile_data.get("profile", {}).get("full_name") if profile_data else None,
                "statistics": profile_data.get("statistics", {}) if profile_data else {}
            },
            "security_score": {
                "score": security_score.get("score", 0) if security_score else 0,
                "level": security_score.get("level", "Beginner") if security_score else "Beginner",
                "factors": security_score.get("factors", {}) if security_score else {}
            },
            "scans": {
                "total": len(scan_history),
                "recent": _format_scans(scan_history[:5])
            },
            "threat_reports": {
                "total": len(threat_reports),
                "recent": _format_reports(threat_reports[:5])
            },
            "labs": {
                "completed": len(completed_labs),
                "total_attempts": len(lab_attempts),
                "recent": _format_labs(completed_labs[:5])
            },
            "quizzes": quiz_stats,
            "glossary": glossary_progress,
            "ai_chat": {
                "total_sessions": len(chat_history),
                "recent": _format_chat_history(chat_history[:5])
            },
            "achievements": {
                "total": len(achievements),
                "recent": achievements[:5]
            },
            "certificates": {
                "total": len(certificates),
                "recent": certificates[:5]
            },
            "daily_challenge": daily_challenge,
            "owasp_simulations": {
                "total_attempts": len(owasp_attempts),
                "recent": _format_owasp_attempts(owasp_attempts[:5])
            }
        }
        
        return dashboard
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard: {str(e)}"
        )


@router.get("/dashboard/{user_id}/quick-stats")
async def get_quick_stats(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get quick statistics for dashboard widgets.
    
    Returns:
        Quick stats summary
    """
    try:
        if str(current_user["_id"]) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get progress
        progress = await progress_repository.get_progress_by_user(user_id)
        
        # Get counts
        lab_attempts = await lab_repository.get_lab_attempts_by_user(user_id, limit=1000)
        completed_labs = len([lab for lab in lab_attempts if lab.get("status") == "completed"])
        
        quiz_attempts = await quiz_repository.get_quiz_attempts_by_user(user_id, limit=1000)
        
        scan_history = await github_repository.get_scans_by_user(user_id, limit=1000)
        
        return {
            "xp": progress.get("xp", 0) if progress else 0,
            "level": progress.get("level", 1) if progress else 1,
            "labs_completed": completed_labs,
            "quizzes_completed": len(quiz_attempts),
            "scans_completed": len(scan_history),
            "achievements": len(progress.get("achievements", [])) if progress else 0,
            "streak_days": progress.get("streak_days", 0) if progress else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching quick stats: {str(e)}"
        )


def _calculate_quiz_statistics(quiz_attempts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate quiz statistics."""
    if not quiz_attempts:
        return {
            "total_attempts": 0,
            "average_score": 0,
            "best_score": 0,
            "recent": []
        }
    
    scores = [q.get("score", 0) for q in quiz_attempts]
    avg_score = sum(scores) / len(scores) if scores else 0
    best_score = max(scores) if scores else 0
    
    return {
        "total_attempts": len(quiz_attempts),
        "average_score": round(avg_score, 2),
        "best_score": best_score,
        "recent": _format_quizzes(quiz_attempts[:5])
    }


def _format_scans(scans: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Format scan history for dashboard."""
    return [
        {
            "id": str(scan.get("_id")),
            "repository": scan.get("repository_name", "Unknown"),
            "vulnerabilities": scan.get("vulnerabilities_count", 0),
            "date": scan.get("created_at")
        }
        for scan in scans
    ]


def _format_reports(reports: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Format threat reports for dashboard."""
    return [
        {
            "id": str(report.get("_id")),
            "title": report.get("title", "Untitled"),
            "severity": report.get("severity", "medium"),
            "date": report.get("created_at")
        }
        for report in reports
    ]


def _format_labs(labs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Format lab completions for dashboard."""
    return [
        {
            "id": str(lab.get("_id")),
            "lab_name": lab.get("lab_name", "Unknown Lab"),
            "category": lab.get("category", "General"),
            "completed_at": lab.get("completed_at")
        }
        for lab in labs
    ]


def _format_quizzes(quizzes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Format quiz attempts for dashboard."""
    return [
        {
            "id": str(quiz.get("_id")),
            "quiz_name": quiz.get("quiz_name", "Unknown Quiz"),
            "score": quiz.get("score", 0),
            "completed_at": quiz.get("completed_at")
        }
        for quiz in quizzes
    ]


def _format_chat_history(chats: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Format chat history for dashboard."""
    return [
        {
            "id": str(chat.get("_id")),
            "topic": chat.get("topic", "General"),
            "messages_count": chat.get("messages_count", 0),
            "last_activity": chat.get("updated_at")
        }
        for chat in chats
    ]


def _format_owasp_attempts(attempts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Format OWASP simulation attempts for dashboard."""
    return [
        {
            "id": str(attempt.get("_id")),
            "simulation_type": attempt.get("simulation_type", "Unknown"),
            "score": attempt.get("score", 0),
            "completed_at": attempt.get("completed_at")
        }
        for attempt in attempts
    ]


async def _get_glossary_progress(user_id: str) -> Dict[str, Any]:
    """Get glossary progress for user."""
    try:
        # This would fetch from glossary repository
        # For now, return placeholder
        return {
            "terms_learned": 0,
            "total_terms": 100,
            "recent_terms": []
        }
    except Exception as e:
        print(f"Error getting glossary progress: {e}")
        return {
            "terms_learned": 0,
            "total_terms": 100,
            "recent_terms": []
        }