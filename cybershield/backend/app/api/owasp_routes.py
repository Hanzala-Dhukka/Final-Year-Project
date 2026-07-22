"""
OWASP Simulator API routes (Module 7.4).

Endpoints (mounted under /api/v1/owasp):
  GET    /labs            List all attack/defense labs (17 vulns)
  POST   /start           Start a simulation session (attack or defense)
  POST   /attack          Submit an attack payload (validated + AI coach)
  POST   /defense         Submit defense code (validated + AI review)
  POST   /coach           Standalone AI coach explanation
  GET    /daily           Today's daily challenge
  POST   /daily/complete  Complete the daily challenge (award XP once)
  GET    /history         Practice history
  GET    /progress        User progress (XP, level, completed labs, badges)
"""
from fastapi import APIRouter, Depends, HTTPException

from app.dependencies.auth import get_current_user
from app.schemas.owasp_schema import (
    StartSimulationRequest,
    AttackRequest,
    DefenseRequest,
    CoachRequest,
    SimulationOut,
    AttackResult,
    DefenseResult,
    CoachResponse,
    DailyChallengeOut,
    ProgressOut,
)
from app.services import simulator_service
from app.services.challenge_service import get_daily, complete_daily

router = APIRouter(
    prefix="/api/v1/owasp",
    tags=["OWASP Simulator (Module 7.4)"],
)


@router.get("/labs", response_model=dict)
async def labs():
    """List all available labs (attack + defense scenarios)."""
    return {"labs": simulator_service.list_labs()}


@router.post("/start", response_model=SimulationOut)
async def start(payload: StartSimulationRequest, user=Depends(get_current_user)):
    """Start a simulation session for a vulnerability in attack or defense mode."""
    sim = await simulator_service.start_simulation(
        str(user["_id"]), payload.vulnerability, payload.mode, payload.difficulty or "Beginner"
    )
    if not sim:
        raise HTTPException(status_code=404, detail="Unknown vulnerability")
    return sim


@router.post("/attack", response_model=AttackResult)
async def attack(payload: AttackRequest, user=Depends(get_current_user)):
    """Submit an attack payload; returns validation + AI coach feedback + XP."""
    result = await simulator_service.submit_attack(
        str(user["_id"]), payload.session_id, payload.payload, payload.hints_used
    )
    if not result:
        raise HTTPException(status_code=404, detail="Session not found or wrong mode")
    return result


@router.post("/defense", response_model=DefenseResult)
async def defense(payload: DefenseRequest, user=Depends(get_current_user)):
    """Submit defense code; returns validation + AI review + XP."""
    result = await simulator_service.submit_defense(
        str(user["_id"]), payload.session_id, payload.user_code, payload.hints_used
    )
    if not result:
        raise HTTPException(status_code=404, detail="Session not found or wrong mode")
    return result


@router.post("/coach", response_model=CoachResponse)
async def coach(payload: CoachRequest):
    """Standalone AI coach explanation for an attempt."""
    return await simulator_service.coach(
        payload.vulnerability, payload.difficulty, payload.payload, payload.success
    )


@router.get("/daily", response_model=DailyChallengeOut)
async def daily(user=Depends(get_current_user)):
    """Get today's daily challenge."""
    return await get_daily(str(user["_id"]))


@router.post("/daily/complete", response_model=dict)
async def daily_complete(user=Depends(get_current_user)):
    """Complete the daily challenge and award XP (once per day)."""
    challenge, xp = await complete_daily(str(user["_id"]))
    return {"challenge": challenge, "xp_awarded": xp}


@router.get("/history", response_model=list)
async def history(user=Depends(get_current_user), limit: int = 50):
    """Get the user's practice history."""
    return await simulator_service.get_history(str(user["_id"]), limit=limit)


@router.get("/progress", response_model=ProgressOut)
async def progress(user=Depends(get_current_user)):
    """Get the user's OWASP simulator progress."""
    return await simulator_service.get_progress(str(user["_id"]))
