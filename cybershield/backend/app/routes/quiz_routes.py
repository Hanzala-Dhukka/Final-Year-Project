from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
import random
import uuid
from app.data.questions import QUESTIONS
from app.models.quiz_model import QuizSubmission
from app.database.db import database
from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/api/v1/quiz",
    tags=["Quiz"]
)

@router.post("/start")
async def start_quiz(difficulty: str = None, current_user: dict = Depends(get_current_user)):
    # Filter by difficulty if provided
    available_questions = QUESTIONS
    if difficulty:
        available_questions = [q for q in QUESTIONS if q.get("difficulty") == difficulty.lower()]
        
    if not available_questions:
        raise HTTPException(status_code=404, detail=f"No questions found for difficulty: {difficulty}")

    # Select up to 10 random questions
    sample_size = min(len(available_questions), 10)
    selected_questions = random.sample(available_questions, sample_size)
    question_ids = [q["id"] for q in selected_questions]
    
    # Generate a unique session ID
    session_id = str(uuid.uuid4())
    
    # Store session in database
    session_data = {
        "session_id": session_id,
        "user_id": str(current_user["_id"]),
        "question_ids": question_ids,
        "difficulty": difficulty.lower() if difficulty else "mixed",
        "created_at": datetime.utcnow(),
        "is_active": True
    }
    
    await database["quiz_sessions"].insert_one(session_data)
    
    return {"session_id": session_id}

@router.get("/questions/{session_id}")
async def get_questions(session_id: str, current_user: dict = Depends(get_current_user)):
    # Find active session
    session = await database["quiz_sessions"].find_one({
        "session_id": session_id,
        "user_id": str(current_user["_id"]),
        "is_active": True
    })
    
    if not session:
        raise HTTPException(status_code=404, detail="Active quiz session not found")
    
    # Retrieve the specific questions for this session
    session_questions = [q for q in QUESTIONS if q["id"] in session["question_ids"]]
    
    # Shuffle options for each question
    random_questions = []
    for q in session_questions:
        shuffled_options = q["options"].copy()
        random.shuffle(shuffled_options)
        
        q_data = {
            "id": q["id"],
            "question": q["question"],
            "options": shuffled_options
        }
        random_questions.append(q_data)
        
    return random_questions

@router.post("/submit")
async def submit_quiz(
    data: QuizSubmission,
    current_user: dict = Depends(get_current_user)
):
    # Verify session
    session = await database["quiz_sessions"].find_one({
        "session_id": data.session_id,
        "user_id": str(current_user["_id"]),
        "is_active": True
    })
    
    if not session:
        raise HTTPException(status_code=404, detail="Invalid or inactive quiz session")

    score = 0
    # Create a lookup map for faster answer checking
    questions_map = {str(q["id"]): q["answer"] for q in QUESTIONS}
    
    # Build the results list by looping through the session questions
    results = []
    submitted_q_ids = []
    
    # Create a full map for faster lookup
    full_questions_map = {q["id"]: q for q in QUESTIONS}
    
    for q_id_int in session["question_ids"]:
        question = full_questions_map.get(q_id_int)
        user_answer = data.answers.get(str(q_id_int))
        
        is_correct = user_answer == question["answer"]
        if is_correct:
            score += 1
            
        submitted_q_ids.append(q_id_int)
        
        results.append({
            "question_id": question["id"],
            "question": question["question"],
            "user_answer": user_answer,
            "correct_answer": question["answer"],
            "is_correct": is_correct,
            "explanation": question["explanation"]
        })
    
    # Save quiz result to database
    total_questions = len(session["question_ids"])
    percentage = (score / total_questions) * 100 if total_questions > 0 else 0
    correct = score
    incorrect = total_questions - score
    
    result_data = {
        "user_id": str(current_user["_id"]),
        "score": score,
        "total": total_questions,
        "correct": correct,
        "incorrect": incorrect,
        "percentage": int(round(percentage)),
        "difficulty": session.get("difficulty", "mixed"),
        "question_ids": submitted_q_ids,
        "results": results,
        "session_id": data.session_id,
        "created_at": datetime.utcnow()
    }
    
    await database["quiz_results"].insert_one(result_data)
    
    # Deactivate the session
    await database["quiz_sessions"].update_one(
        {"session_id": data.session_id},
        {"$set": {"is_active": False}}
    )
    
    return {
        "score": score,
        "total": total_questions,
        "correct": correct,
        "incorrect": incorrect,
        "percentage": int(round(percentage)),
        "results": results
    }

@router.get("/history")
async def get_quiz_history(current_user: dict = Depends(get_current_user)):
    history = await database["quiz_results"].find(
        {"user_id": str(current_user["_id"])}
    ).sort("created_at", -1).to_list(length=100)
    
    # Convert MongoDB _id to string for JSON serialization
    for item in history:
        item["_id"] = str(item["_id"])
        
    return history
