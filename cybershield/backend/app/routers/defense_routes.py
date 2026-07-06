from fastapi import APIRouter, HTTPException
from app.schemas.defense_schema import (
    DefenseSubmission, DefenseResult, DefenseSession, DefenseHistory
)
from app.services.defense_validator import DefenseValidator
from app.services.ai_feedback import AIFeedbackEngine
from app.data.defense_scenarios import (
    get_scenario_by_id, get_scenarios_by_category, 
    get_all_categories, get_random_scenario
)
from app.services.google_sheets_service import save_defense_session_to_sheet
import uuid
from datetime import datetime

router = APIRouter()

# In-memory storage for defense sessions
defense_sessions_store = {}
defense_history_store = {}


@router.get("/categories")
async def get_categories():
    """Get all available OWASP defense categories"""
    try:
        categories = get_all_categories()
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get categories: {str(e)}")


@router.get("/scenario/{category}")
async def get_scenario(category: str):
    """Get a random scenario for a category"""
    try:
        scenario = get_random_scenario(category)
        if not scenario:
            raise HTTPException(status_code=404, detail="No scenarios found for this category")
        return scenario
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scenario: {str(e)}")


@router.get("/scenario/id/{scenario_id}")
async def get_scenario_by_id_endpoint(scenario_id: str):
    """Get a specific scenario by ID"""
    try:
        scenario = get_scenario_by_id(scenario_id)
        if not scenario:
            raise HTTPException(status_code=404, detail="Scenario not found")
        return scenario
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scenario: {str(e)}")


@router.post("/submit", response_model=DefenseResult)
async def submit_defense(submission: DefenseSubmission):
    """Submit defense code for validation"""
    try:
        # Get scenario
        scenario = get_scenario_by_id(submission.scenario_id)
        if not scenario:
            raise HTTPException(status_code=404, detail="Scenario not found")
        
        # Validate the defense code
        validation_result = DefenseValidator.validate_defense(
            submission.category,
            submission.user_code
        )
        
        # Generate AI-enhanced feedback
        feedback_result = AIFeedbackEngine.generate_feedback(
            submission.category,
            submission.user_code,
            validation_result,
            scenario
        )
        
        # Create session
        session_id = f"DEF-{str(uuid.uuid4())[:8].upper()}"
        timestamp = datetime.utcnow().isoformat()
        
        session = DefenseSession(
            session_id=session_id,
            user_id=submission.user_id or "anonymous",
            category=submission.category,
            scenario_id=submission.scenario_id,
            score=feedback_result["score"],
            status=feedback_result["status"],
            time_taken=0,
            timestamp=timestamp
        )
        
        # Store session
        defense_sessions_store[session_id] = session
        
        # Update user history
        user_id = submission.user_id or "anonymous"
        if user_id not in defense_history_store:
            defense_history_store[user_id] = {
                "user_id": user_id,
                "sessions": [],
                "total_score": 0,
                "categories_completed": [],
                "achievements": []
            }
        
        history = defense_history_store[user_id]
        history["sessions"].append(session)
        history["total_score"] += feedback_result["score"]
        
        if submission.category not in history["categories_completed"]:
            history["categories_completed"].append(submission.category)
        
        # Check for achievements
        achievements = AIFeedbackEngine._check_achievements(history)
        history["achievements"].extend(achievements)
        
        # Save to Google Sheets
        save_defense_session_to_sheet(
            session_id=session_id,
            user_id=submission.user_id or "anonymous",
            category=submission.category,
            score=feedback_result["score"],
            status=feedback_result["status"],
            time_taken=0
        )
        
        # Return result
        return DefenseResult(
            scenario_id=submission.scenario_id,
            category=submission.category,
            score=feedback_result["score"],
            status=feedback_result["status"],
            feedback=feedback_result["feedback"],
            recommendation=feedback_result["recommendation"],
            owasp_reference=feedback_result["owasp_reference"],
            best_practices=feedback_result["best_practices"],
            secure_code_example=feedback_result["secure_code_example"],
            timestamp=timestamp
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit defense: {str(e)}")


@router.get("/history/{user_id}", response_model=DefenseHistory)
async def get_defense_history(user_id: str):
    """Get defense history for a user"""
    try:
        if user_id not in defense_history_store:
            return DefenseHistory(
                user_id=user_id,
                sessions=[],
                total_score=0,
                categories_completed=[],
                achievements=[]
            )
        
        history = defense_history_store[user_id]
        return DefenseHistory(**history)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get a specific defense session"""
    try:
        if session_id not in defense_sessions_store:
            raise HTTPException(status_code=404, detail="Session not found")
        return defense_sessions_store[session_id]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get session: {str(e)}")


@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    """Get top users by score"""
    try:
        leaderboard = []
        for user_id, history in defense_history_store.items():
            leaderboard.append({
                "user_id": user_id,
                "total_score": history["total_score"],
                "categories_completed": len(history["categories_completed"]),
                "achievements": len(history["achievements"]),
                "sessions_count": len(history["sessions"])
            })
        
        # Sort by total score
        leaderboard.sort(key=lambda x: x["total_score"], reverse=True)
        
        return {
            "leaderboard": leaderboard[:limit],
            "total_users": len(leaderboard)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get leaderboard: {str(e)}")


@router.get("/achievements/{user_id}")
async def get_achievements(user_id: str):
    """Get achievements for a user"""
    try:
        if user_id not in defense_history_store:
            return {"achievements": []}
        
        history = defense_history_store[user_id]
        return {
            "achievements": history["achievements"],
            "total_achievements": len(history["achievements"])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get achievements: {str(e)}")


@router.get("/hint/{scenario_id}")
async def get_hint(scenario_id: str, hint_level: int = 1):
    """Get hint for a scenario"""
    try:
        hint = AIFeedbackEngine.generate_hint("", scenario_id, hint_level)
        return {
            "scenario_id": scenario_id,
            "hint_level": hint_level,
            "hint": hint
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get hint: {str(e)}")


@router.get("/explain/{category}")
async def explain_category(category: str):
    """Get OWASP explanation for a category"""
    try:
        explanation = AIFeedbackEngine.explain_owasp(category)
        return {
            "category": category,
            "explanation": explanation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get explanation: {str(e)}")


@router.get("/stats")
async def get_stats():
    """Get overall statistics"""
    try:
        total_sessions = len(defense_sessions_store)
        total_users = len(defense_history_store)
        
        # Calculate average score
        all_scores = [s.score for s in defense_sessions_store.values()]
        avg_score = sum(all_scores) / len(all_scores) if all_scores else 0
        
        # Count by category
        category_counts = {}
        for session in defense_sessions_store.values():
            cat = session.category
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        # Count by status
        status_counts = {}
        for session in defense_sessions_store.values():
            status = session.status
            status_counts[status] = status_counts.get(status, 0) + 1
        
        return {
            "total_sessions": total_sessions,
            "total_users": total_users,
            "average_score": round(avg_score, 2),
            "categories": category_counts,
            "status_breakdown": status_counts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


# Add method to AIFeedbackEngine for achievements
AIFeedbackEngine._check_achievements = staticmethod(lambda history: [])


@router.get("/health")
async def health_check():
    """Check defense mode health"""
    return {
        "status": "healthy",
        "categories_available": len(get_all_categories()),
        "total_scenarios": sum(len(scenarios) for scenarios in get_all_categories())
    }