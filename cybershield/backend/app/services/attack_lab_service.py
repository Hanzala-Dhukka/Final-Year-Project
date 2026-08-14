from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
from app.data.attack_labs import get_lab_by_id, get_all_labs
from app.services.lab_validator import LabValidator
from app.services.google_sheets_service import save_attack_lab_to_sheet
from app.core.database import get_collection


class AttackLabService:
    """Service for managing interactive attack labs (persisted to MongoDB)."""

    def __init__(self):
        # In-memory cache of active lab sessions (DB is the source of truth).
        self.lab_sessions: Dict[str, Dict[str, Any]] = {}
        self.user_progress: Dict[str, Dict[str, Any]] = {}

    def get_lab(self, lab_id: str) -> Optional[Dict[str, Any]]:
        """Get lab details"""
        return get_lab_by_id(lab_id)

    def get_all_labs(self) -> List[Dict[str, Any]]:
        """Get all available labs"""
        return get_all_labs()

    def get_labs_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get labs by category"""
        from app.data.attack_labs import get_labs_by_category
        return get_labs_by_category(category)

    # ---- Persistence helpers ----

    async def _load_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Load a session from the in-memory cache or MongoDB."""
        session = self.lab_sessions.get(session_id)
        if session:
            return session
        return await get_collection("lab_sessions").find_one({"session_id": session_id})

    async def _save_session(self, session: Dict[str, Any]) -> None:
        """Persist a lab session to MongoDB and keep the in-memory cache warm."""
        self.lab_sessions[session["session_id"]] = session
        await get_collection("lab_sessions").replace_one(
            {"session_id": session["session_id"]}, session, upsert=True
        )

    async def start_lab(self, lab_id: str, user_id: str = "anonymous") -> Dict[str, Any]:
        """
        Start a new lab session and persist it.

        Args:
            lab_id: Lab identifier
            user_id: User identifier

        Returns:
            Lab session object
        """
        lab = get_lab_by_id(lab_id)
        if not lab:
            raise ValueError(f"Lab {lab_id} not found")

        session_id = f"LAB-{str(uuid.uuid4())[:8].upper()}"

        # Determine max attempts based on difficulty
        difficulty = lab.get("difficulty", "Easy")
        max_attempts = {
            "Easy": 10,
            "Medium": 5,
            "Hard": 3
        }.get(difficulty, 5)

        session = {
            "session_id": session_id,
            "lab_id": lab_id,
            "user_id": user_id,
            "current_state": "scenario",
            "attempts": 0,
            "max_attempts": max_attempts,
            "hint_used": False,
            "attack_success": False,
            "defense_success": False,
            "total_xp": 0,
            "started_at": datetime.utcnow(),
            "completed_at": None
        }

        await self._save_session(session)

        return {
            "session_id": session_id,
            "lab": lab,
            "session": session
        }

    async def submit_attack(self, session_id: str, payload: str) -> Dict[str, Any]:
        """
        Submit attack payload and persist the attempt.

        Args:
            session_id: Lab session ID
            payload: Attack payload

        Returns:
            Attack result
        """
        session = await self._load_session(session_id)
        if not session:
            raise ValueError("Session not found")

        lab = get_lab_by_id(session["lab_id"])

        if not lab:
            raise ValueError("Lab not found")

        # Check if max attempts reached
        if session["attempts"] >= session["max_attempts"]:
            return {
                "success": False,
                "server_response": "Maximum attempts reached. Please try again later.",
                "points_earned": 0,
                "explanation": "You've used all available attempts.",
                "xp_earned": 0,
                "next_step": "retry",
                "attempts_remaining": 0
            }

        # Increment attempts
        session["attempts"] += 1

        # Validate payload
        category = lab["category"]
        validation_result = LabValidator.validate_attack(category, payload, session["lab_id"])

        # Calculate points
        points_earned = 0
        xp_earned = 0
        success = validation_result["success"]

        if success:
            # Full points on first successful attempt
            points_earned = validation_result["points"]
            xp_earned = lab.get("xp_reward", 100)
            session["attack_success"] = True
            session["current_state"] = "success"
            session["total_xp"] += xp_earned
            next_step = "defense"
            server_response = lab["server_responses"]["correct"]
        else:
            # No points for failed attempt
            points_earned = 0
            xp_earned = 0
            next_step = "retry"
            server_response = lab["server_responses"]["wrong"]

        now = datetime.utcnow()

        # Save attempt to lab_attempts (drives profile stats / security score)
        await get_collection("lab_attempts").insert_one({
            "user_id": session["user_id"],
            "lab_id": session["lab_id"],
            "session_id": session_id,
            "category": category,
            "difficulty": lab.get("difficulty", "Easy"),
            "payload": payload,
            "success": success,
            "score": points_earned,
            "attempts": session["attempts"],
            "status": "attempted",
            "started_at": now,
            "timestamp": now
        })

        # Simulator record (drives admin OWASP stats)
        await get_collection("owasp_simulations").insert_one({
            "user_id": session["user_id"],
            "attack_type": category,
            "payload": payload,
            "success": success,
            "lab_id": session["lab_id"],
            "created_at": now
        })

        # Save to Google Sheets
        save_attack_lab_to_sheet(
            lab_id=session["lab_id"],
            user_id=session["user_id"],
            category=lab["category"],
            difficulty=lab["difficulty"],
            score=points_earned,
            completed=success,
            time_taken=0
        )

        await self._save_session(session)

        return {
            "success": success,
            "server_response": server_response,
            "points_earned": points_earned,
            "explanation": validation_result["explanation"],
            "xp_earned": xp_earned,
            "next_step": next_step,
            "modified_query": validation_result.get("modified_query"),
            "attempts_remaining": session["max_attempts"] - session["attempts"],
            "attempts_used": session["attempts"]
        }

    async def submit_defense(self, session_id: str, secure_code: str) -> Dict[str, Any]:
        """
        Submit defense code after successful attack and persist completion.

        Args:
            session_id: Lab session ID
            secure_code: User's secure code

        Returns:
            Defense result
        """
        session = await self._load_session(session_id)
        if not session:
            raise ValueError("Session not found")

        lab = get_lab_by_id(session["lab_id"])

        if not lab:
            raise ValueError("Lab not found")

        # Check if attack was successful
        if not session["attack_success"]:
            return {
                "success": False,
                "message": "You must successfully complete the attack before submitting defense.",
                "next_step": "attack"
            }

        # Use defense validator from Module 4.1
        from app.services.defense_validator import DefenseValidator
        category = lab["category"]

        # Map lab categories to defense categories
        category_mapping = {
            "SQL Injection": "SQL Injection",
            "XSS": "XSS",
            "Command Injection": "Command Injection",
            "CSRF": "XSS",  # Use XSS validator as fallback
            "SSRF": "Path Traversal",  # Use Path Traversal validator as fallback
            "Insecure Direct Object Reference": "Path Traversal"
        }

        defense_category = category_mapping.get(category, "SQL Injection")
        validation_result = DefenseValidator.validate_defense(defense_category, secure_code)

        # Persist the defense answer (always, pass or fail) so it survives restarts
        now = datetime.utcnow()
        await get_collection("lab_defenses").insert_one({
            "user_id": session["user_id"],
            "lab_id": session["lab_id"],
            "session_id": session_id,
            "category": category,
            "difficulty": lab.get("difficulty", "Easy"),
            "secure_code": secure_code,
            "score": validation_result["score"],
            "status": validation_result["status"],
            "success": validation_result["score"] >= 80,
            "feedback": validation_result["feedback"],
            "recommendation": validation_result.get("recommendation", ""),
            "best_practices": validation_result.get("best_practices", []),
            "timestamp": now,
            "started_at": now,
        })

        # Calculate defense XP
        defense_xp = 50 if validation_result["score"] >= 80 else 25
        session["defense_success"] = validation_result["score"] >= 80
        session["total_xp"] += defense_xp

        # Check if lab is complete
        lab_complete = session["attack_success"] and session["defense_success"]

        if lab_complete:
            session["current_state"] = "completed"
            session["completed_at"] = datetime.utcnow()

            # Mark matching lab attempts as completed (drives profile/security score).
            # The defense route may run on a fresh session, so match by user + lab.
            await get_collection("lab_attempts").update_many(
                {"user_id": session["user_id"], "lab_id": session["lab_id"]},
                {"$set": {"status": "completed", "completed_at": now, "score": 100}}
            )

            # Upsert an owasp_sessions completion row so dashboards count it
            await get_collection("owasp_sessions").update_one(
                {"user_id": session["user_id"], "lab_id": session["lab_id"]},
                {"$set": {
                    "user_id": session["user_id"],
                    "lab_id": session["lab_id"],
                    "lab_name": lab.get("title", session["lab_id"]),
                    "category": category,
                    "status": "completed",
                    "score": 100,
                    "xp": session["total_xp"],
                    "completed_at": now,
                }},
                upsert=True
            )

        # Persist session state
        await self._save_session(session)

        # Update user progress (XP, labs completed, badges)
        await self._update_user_progress(session["user_id"], session["total_xp"], lab_complete, lab)

        return {
            "success": validation_result["score"] >= 80,
            "score": validation_result["score"],
            "status": validation_result["status"],
            "feedback": validation_result["feedback"],
            "recommendation": validation_result.get("recommendation", ""),
            "best_practices": validation_result["best_practices"],
            "secure_code_example": validation_result.get("secure_code_example", ""),
            "defense_xp": defense_xp,
            "total_xp": session["total_xp"],
            "lab_complete": lab_complete,
            "badge_earned": lab.get("badge_reward") if lab_complete else None,
            "next_step": "completed" if lab_complete else "retry"
        }

    async def get_hint(self, session_id: str, attempt_number: int) -> Dict[str, Any]:
        """
        Get progressive hint based on attempts.

        Args:
            session_id: Lab session ID
            attempt_number: Current attempt number

        Returns:
            Hint object
        """
        session = await self._load_session(session_id)
        if not session:
            raise ValueError("Session not found")

        lab = get_lab_by_id(session["lab_id"])

        if not lab:
            raise ValueError("Lab not found")

        # Mark hint as used
        session["hint_used"] = True
        await self._save_session(session)

        # Progressive hints
        hints = lab.get("hints", [])

        if attempt_number == 1:
            hint = "Think carefully about the vulnerability type."
        elif attempt_number == 2:
            hint = hints[0] if len(hints) > 0 else lab.get("hint", "No hint available")
        elif attempt_number == 3:
            hint = hints[1] if len(hints) > 1 else lab.get("hint", "No hint available")
        else:
            hint = hints[2] if len(hints) > 2 else f"Solution: {lab.get('solution', 'N/A')}"

        return {
            "hint": hint,
            "attempt_number": attempt_number,
            "hints_remaining": max(0, 3 - attempt_number)
        }

    async def get_user_progress(self, user_id: str) -> Dict[str, Any]:
        """Get user progress and achievements from MongoDB."""
        doc = await get_collection("lab_progress").find_one({"user_id": user_id})
        if doc:
            self.user_progress[user_id] = doc
            return doc

        return {
            "user_id": user_id,
            "total_xp": 0,
            "labs_completed": 0,
            "total_labs": len(get_all_labs()),
            "badges": [],
            "completion_percentage": 0.0,
            "category_progress": {}
        }

    async def get_leaderboard(self, limit: int = 10) -> Dict[str, Any]:
        """Get top users by XP from MongoDB."""
        leaderboard = []
        cursor = get_collection("lab_progress").find({}).sort("total_xp", -1).limit(limit)
        async for progress in cursor:
            leaderboard.append({
                "user_id": progress.get("user_id"),
                "total_xp": progress.get("total_xp", 0),
                "labs_completed": progress.get("labs_completed", 0),
                "badges_count": len(progress.get("badges", []) or []),
                "completion_percentage": progress.get("completion_percentage", 0.0)
            })

        total_users = await get_collection("lab_progress").count_documents({})

        return {
            "leaderboard": leaderboard,
            "total_users": total_users
        }

    async def _update_user_progress(
        self,
        user_id: str,
        xp_earned: int,
        lab_completed: bool,
        lab: Optional[Dict[str, Any]] = None
    ) -> None:
        """Update and persist user progress (awards XP/badges once per completed lab)."""
        progress = await get_collection("lab_progress").find_one({"user_id": user_id})
        if not progress:
            progress = {
                "user_id": user_id,
                "total_xp": 0,
                "labs_completed": 0,
                "total_labs": len(get_all_labs()),
                "badges": [],
                "completion_percentage": 0.0,
                "category_progress": {},
                "completed_lab_ids": []
            }

        self.user_progress[user_id] = progress

        if lab_completed and lab:
            completed_ids = progress.get("completed_lab_ids", []) or []
            if lab["lab_id"] not in completed_ids:
                completed_ids.append(lab["lab_id"])
                progress["completed_lab_ids"] = completed_ids
                progress["total_xp"] += xp_earned
                progress["labs_completed"] += 1

                badge = lab.get("badge_reward")
                if badge and badge not in progress["badges"]:
                    progress["badges"].append(badge)

        progress["completion_percentage"] = (
            (progress["labs_completed"] / progress["total_labs"]) * 100
            if progress.get("total_labs") else 0.0
        )
        progress["completion_percentage"] = min(100, round(progress["completion_percentage"], 1))

        await get_collection("lab_progress").replace_one(
            {"user_id": user_id}, progress, upsert=True
        )


# Global service instance
attack_lab_service = AttackLabService()
