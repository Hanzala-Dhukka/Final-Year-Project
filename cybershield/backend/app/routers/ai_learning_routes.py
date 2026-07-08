from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.schemas.ai_learning_schema import (
    ExplainRequest,
    ExplainResponse,
    HintRequest,
    HintResponse,
    PracticeQuestionRequest,
    PracticeQuestionResponse,
    ProgressUpdateRequest,
    ProgressResponse,
    LearningHistory,
    AdaptiveDifficultyRequest,
    AdaptiveDifficultyResponse
)
from app.services.ai_learning_service import (
    get_explanation,
    get_hint,
    generate_practice_question,
    save_learning_progress,
    get_user_progress
)
from app.services.adaptive_learning import AdaptiveLearningEngine

router = APIRouter()
adaptive_engine = AdaptiveLearningEngine()


@router.post("/explain", response_model=Dict[str, Any])
async def explain_attempt(request: ExplainRequest):
    """
    Generate personalized explanation for user's attempt
    
    - **topic**: Security topic (e.g., "SQL Injection")
    - **payload**: User's attack payload
    - **result**: "correct" or "incorrect"
    - **skill_level**: "Beginner", "Intermediate", or "Advanced"
    - **user_id**: User identifier (optional)
    - **attempt_number**: Which attempt this is (optional)
    - **previous_hints**: List of previous hints given (optional)
    """
    try:
        result = await get_explanation(request.dict())
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating explanation: {str(e)}")


@router.post("/hint", response_model=Dict[str, Any])
async def get_hint_route(request: HintRequest):
    """
    Generate progressive hint for user (1-3 levels)
    
    - **topic**: Security topic
    - **payload**: Current payload attempt
    - **hint_number**: 1, 2, or 3 (1 is subtle, 3 is direct)
    - **skill_level**: User's skill level
    - **user_id**: User identifier (optional)
    - **lab_id**: Lab identifier (optional)
    - **previous_hints**: List of previous hints given (optional)
    """
    try:
        result = await get_hint(request.dict())
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating hint: {str(e)}")


@router.post("/practice", response_model=Dict[str, Any])
async def generate_practice_question_route(request: PracticeQuestionRequest):
    """
    Generate AI-powered practice question
    
    - **topic**: Security topic
    - **skill_level**: User's skill level
    - **user_id**: User identifier (optional)
    - **question_type**: "multiple_choice", "code_fix", or "payload_write" (optional)
    """
    try:
        result = await generate_practice_question(
            topic=request.topic,
            skill_level=request.skill_level,
            user_id=request.user_id,
            question_type=request.question_type
        )
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating practice question: {str(e)}")


@router.post("/progress", response_model=Dict[str, Any])
async def update_progress_route(request: ProgressUpdateRequest):
    """
    Update user learning progress
    
    - **user_id**: User identifier
    - **topic**: Topic name
    - **result**: "correct" or "incorrect"
    - **score**: Score achieved (0-100)
    - **attempts**: Number of attempts
    - **weakness**: Optional weakness area identified
    - **lab_id**: Optional lab identifier
    """
    try:
        result = await save_learning_progress(
            user_id=request.user_id,
            topic=request.topic,
            result=request.result,
            score=request.score,
            attempts=request.attempts,
            lab_id=request.lab_id
        )
        
        # Get updated progress
        progress = await get_user_progress(request.user_id)
        
        return {
            "success": True,
            "data": {
                "saved": result,
                "progress": progress
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating progress: {str(e)}")


@router.get("/progress/{user_id}", response_model=Dict[str, Any])
async def get_progress_route(user_id: str):
    """
    Get user's learning progress and statistics
    
    - **user_id**: User identifier
    """
    try:
        progress = await get_user_progress(user_id)
        return {
            "success": True,
            "data": progress
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving progress: {str(e)}")


@router.get("/history/{user_id}", response_model=Dict[str, Any])
async def get_learning_history_route(user_id: str, topic: str = None):
    """
    Get user's complete learning history
    
    - **user_id**: User identifier
    - **topic**: Optional topic filter
    """
    try:
        from app.services.ai_learning_service import learning_history_db
        
        if user_id not in learning_history_db:
            return {
                "success": True,
                "data": {
                    "user_id": user_id,
                    "history": [],
                    "message": "No learning history yet"
                }
            }
        
        history = learning_history_db[user_id]
        
        # Filter by topic if provided
        if topic:
            topic_history = [h for h in history.get("history", []) if h.get("topic") == topic]
            return {
                "success": True,
                "data": {
                    "user_id": user_id,
                    "topic": topic,
                    "history": topic_history
                }
            }
        
        return {
            "success": True,
            "data": history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving learning history: {str(e)}")


@router.post("/adaptive-difficulty", response_model=Dict[str, Any])
async def get_adaptive_difficulty_route(request: AdaptiveDifficultyRequest):
    """
    Get adaptive difficulty recommendation based on user performance
    
    - **user_id**: User identifier
    - **topic**: Current topic
    - **current_difficulty**: Current difficulty level
    """
    try:
        from app.services.ai_learning_service import learning_history_db
        
        # Get user's performance history
        history_key = f"{request.user_id}_{request.topic}"
        history = learning_history_db.get(history_key, {})
        performance_history = history.get("history", [])
        
        # Get adaptive difficulty
        recommendation = adaptive_engine.get_adaptive_difficulty(
            user_id=request.user_id,
            topic=request.topic,
            current_difficulty=request.current_difficulty,
            performance_history=performance_history
        )
        
        return {
            "success": True,
            "data": recommendation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting adaptive difficulty: {str(e)}")


@router.get("/learning-path/{user_id}", response_model=Dict[str, Any])
async def get_learning_path_route(user_id: str, current_topic: str = "Web Security"):
    """
    Get personalized learning path for user
    
    - **user_id**: User identifier
    - **current_topic**: Current topic being learned
    """
    try:
        from app.services.recommendation_engine import get_learning_path
        from app.services.ai_learning_service import user_progress_db
        
        # Get user's skill level
        skill_level = "Beginner"
        if user_id in user_progress_db:
            skill_level = user_progress_db[user_id].get("skill_level", "Beginner")
        
        # Generate learning path
        learning_path = get_learning_path(user_id, current_topic, skill_level)
        
        return {
            "success": True,
            "data": {
                "user_id": user_id,
                "skill_level": skill_level,
                "learning_path": learning_path,
                "current_topic": current_topic
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting learning path: {str(e)}")


@router.get("/weak-areas/{user_id}", response_model=Dict[str, Any])
async def get_weak_areas_route(user_id: str):
    """
    Get user's weak areas based on learning history
    
    - **user_id**: User identifier
    """
    try:
        progress = await get_user_progress(user_id)
        
        return {
            "success": True,
            "data": {
                "user_id": user_id,
                "weakest_area": progress.get("weakest_area"),
                "strongest_area": progress.get("strongest_area"),
                "accuracy": progress.get("accuracy"),
                "recommendation": f"Focus on {progress.get('weakest_area') or 'fundamentals'} to improve your skills"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving weak areas: {str(e)}")


@router.get("/skill-level/{user_id}", response_model=Dict[str, Any])
async def get_user_skill_level_route(user_id: str):
    """
    Get user's current skill level and progression
    
    - **user_id**: User identifier
    """
    try:
        progress = await get_user_progress(user_id)
        
        return {
            "success": True,
            "data": {
                "user_id": user_id,
                "skill_level": progress.get("skill_level"),
                "completed_topics": progress.get("completed_topics"),
                "average_score": progress.get("average_score"),
                "total_attempts": progress.get("total_attempts"),
                "next_level_requirements": _get_next_level_requirements(progress.get("skill_level", "Beginner"))
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving skill level: {str(e)}")


def _get_next_level_requirements(current_level: str) -> Dict[str, Any]:
    """Get requirements to reach next skill level"""
    
    requirements = {
        "Beginner": {
            "next_level": "Intermediate",
            "requirements": {
                "accuracy": "70%",
                "average_score": "70/100",
                "labs_completed": 5
            },
            "tip": "Complete 5 labs with 70% accuracy to reach Intermediate level"
        },
        "Intermediate": {
            "next_level": "Advanced",
            "requirements": {
                "accuracy": "90%",
                "average_score": "85/100",
                "labs_completed": 10
            },
            "tip": "Complete 10 labs with 90% accuracy to reach Advanced level"
        },
        "Advanced": {
            "next_level": "Expert",
            "requirements": {
                "accuracy": "95%",
                "average_score": "90/100",
                "labs_completed": 20
            },
            "tip": "You're at the highest level! Keep mastering advanced topics."
        }
    }
    
    return requirements.get(current_level, requirements["Beginner"])