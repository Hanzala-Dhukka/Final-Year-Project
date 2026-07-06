from fastapi import APIRouter, HTTPException
from app.schemas.lab_schema import (
    LabSubmission, DefenseSubmission, LabResult, UserProgress, LabStats
)
from app.services.attack_lab_service import attack_lab_service
from app.services.google_sheets_service import save_attack_lab_to_sheet
import uuid
from datetime import datetime

router = APIRouter()


@router.get("/labs")
async def get_all_labs():
    """Get all available attack labs"""
    try:
        labs = attack_lab_service.get_all_labs()
        return {
            "labs": labs,
            "total": len(labs)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get labs: {str(e)}")


@router.get("/labs/category/{category}")
async def get_labs_by_category(category: str):
    """Get labs by category"""
    try:
        labs = attack_lab_service.get_labs_by_category(category)
        return {
            "category": category,
            "labs": labs,
            "total": len(labs)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get labs: {str(e)}")


@router.get("/lab/{lab_id}")
async def get_lab(lab_id: str):
    """Get lab details"""
    try:
        lab = attack_lab_service.get_lab(lab_id)
        if not lab:
            raise HTTPException(status_code=404, detail="Lab not found")
        return lab
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get lab: {str(e)}")


@router.post("/lab/start")
async def start_lab(lab_id: str, user_id: str = "anonymous"):
    """Start a new lab session"""
    try:
        result = attack_lab_service.start_lab(lab_id, user_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start lab: {str(e)}")


@router.post("/lab/attack", response_model=LabResult)
async def submit_attack(submission: LabSubmission):
    """Submit attack payload"""
    try:
        # For simplicity, create a temporary session
        # In production, you'd manage sessions properly
        session_result = attack_lab_service.start_lab(submission.lab_id, submission.user_id)
        session_id = session_result["session_id"]
        
        # Submit attack
        result = attack_lab_service.submit_attack(session_id, submission.payload)
        
        return LabResult(
            success=result["success"],
            server_response=result["server_response"],
            points_earned=result["points_earned"],
            explanation=result["explanation"],
            xp_earned=result["xp_earned"],
            badge_earned=result.get("badge_earned"),
            next_step=result["next_step"],
            modified_query=result.get("modified_query")
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit attack: {str(e)}")


@router.post("/lab/defense")
async def submit_defense(submission: DefenseSubmission):
    """Submit defense code"""
    try:
        # For simplicity, create a temporary session and mark attack as successful
        session_result = attack_lab_service.start_lab(submission.lab_id, submission.user_id)
        session_id = session_result["session_id"]
        
        # Mark attack as successful (in production, check actual session state)
        session = attack_lab_service.lab_sessions[session_id]
        session["attack_success"] = True
        
        # Submit defense
        result = attack_lab_service.submit_defense(session_id, submission.secure_code)
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit defense: {str(e)}")


@router.get("/lab/hint/{session_id}")
async def get_hint(session_id: str, attempt_number: int = 1):
    """Get progressive hint"""
    try:
        result = attack_lab_service.get_hint(session_id, attempt_number)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get hint: {str(e)}")


@router.get("/progress/{user_id}", response_model=UserProgress)
async def get_user_progress(user_id: str):
    """Get user progress and achievements"""
    try:
        progress = attack_lab_service.get_user_progress(user_id)
        return UserProgress(**progress)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get progress: {str(e)}")


@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    """Get leaderboard"""
    try:
        result = attack_lab_service.get_leaderboard(limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get leaderboard: {str(e)}")


@router.get("/stats", response_model=LabStats)
async def get_stats():
    """Get overall lab statistics"""
    try:
        total_labs = len(attack_lab_service.get_all_labs())
        
        # Calculate stats
        total_attempts = sum(
            session["attempts"] 
            for session in attack_lab_service.lab_sessions.values()
        )
        
        # Calculate average score
        scores = []
        for session in attack_lab_service.lab_sessions.values():
            if session.get("attack_success"):
                scores.append(100)
        
        average_score = sum(scores) / len(scores) if scores else 0
        
        # Calculate completion rate
        total_sessions = len(attack_lab_service.lab_sessions)
        completed_sessions = sum(
            1 for session in attack_lab_service.lab_sessions.values()
            if session.get("current_state") == "completed"
        )
        completion_rate = (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0
        
        # Get popular labs
        lab_counts = {}
        for session in attack_lab_service.lab_sessions.values():
            lab_id = session["lab_id"]
            lab_counts[lab_id] = lab_counts.get(lab_id, 0) + 1
        
        popular_labs = sorted(lab_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        popular_labs_list = [
            {"lab_id": lab_id, "attempts": count}
            for lab_id, count in popular_labs
        ]
        
        return LabStats(
            total_labs=total_labs,
            total_attempts=total_attempts,
            average_score=round(average_score, 2),
            completion_rate=round(completion_rate, 2),
            popular_labs=popular_labs_list
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.get("/categories")
async def get_categories():
    """Get all lab categories"""
    try:
        from app.data.attack_labs import get_all_categories
        categories = get_all_categories()
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get categories: {str(e)}")


@router.get("/health")
async def health_check():
    """Check labs service health"""
    try:
        labs = attack_lab_service.get_all_labs()
        return {
            "status": "healthy",
            "total_labs": len(labs),
            "categories": list(set(lab["category"] for lab in labs))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")