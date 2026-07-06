from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
from app.data.attack_labs import get_lab_by_id, get_all_labs
from app.services.lab_validator import LabValidator
from app.services.google_sheets_service import save_attack_lab_to_sheet


class AttackLabService:
    """Service for managing interactive attack labs"""
    
    def __init__(self):
        # In-memory storage for lab sessions
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
    
    def start_lab(self, lab_id: str, user_id: str = "anonymous") -> Dict[str, Any]:
        """
        Start a new lab session
        
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
            "started_at": datetime.utcnow().isoformat(),
            "completed_at": None
        }
        
        self.lab_sessions[session_id] = session
        
        return {
            "session_id": session_id,
            "lab": lab,
            "session": session
        }
    
    def submit_attack(self, session_id: str, payload: str) -> Dict[str, Any]:
        """
        Submit attack payload
        
        Args:
            session_id: Lab session ID
            payload: Attack payload
            
        Returns:
            Attack result
        """
        if session_id not in self.lab_sessions:
            raise ValueError("Session not found")
        
        session = self.lab_sessions[session_id]
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
        
        # Save attempt
        attempt = {
            "attempt_id": f"ATT-{str(uuid.uuid4())[:8].upper()}",
            "session_id": session_id,
            "lab_id": session["lab_id"],
            "user_id": session["user_id"],
            "payload": payload,
            "success": success,
            "server_response": server_response,
            "points_earned": points_earned,
            "attempt_number": session["attempts"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
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
    
    def submit_defense(self, session_id: str, secure_code: str) -> Dict[str, Any]:
        """
        Submit defense code after successful attack
        
        Args:
            session_id: Lab session ID
            secure_code: User's secure code
            
        Returns:
            Defense result
        """
        if session_id not in self.lab_sessions:
            raise ValueError("Session not found")
        
        session = self.lab_sessions[session_id]
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
        
        # Calculate defense XP
        defense_xp = 50 if validation_result["score"] >= 80 else 25
        session["defense_success"] = validation_result["score"] >= 80
        session["total_xp"] += defense_xp
        
        # Check if lab is complete
        lab_complete = session["attack_success"] and session["defense_success"]
        
        if lab_complete:
            session["current_state"] = "completed"
            session["completed_at"] = datetime.utcnow().isoformat()
            
            # Award badge
            badge = lab.get("badge_reward")
            if badge:
                self._award_badge(session["user_id"], badge)
        
        # Update user progress
        self._update_user_progress(session["user_id"], session["total_xp"], lab_complete)
        
        return {
            "success": validation_result["score"] >= 80,
            "score": validation_result["score"],
            "status": validation_result["status"],
            "feedback": validation_result["feedback"],
            "recommendation": validation_result["recommendation"],
            "best_practices": validation_result["best_practices"],
            "secure_code_example": validation_result.get("secure_code_example", ""),
            "defense_xp": defense_xp,
            "total_xp": session["total_xp"],
            "lab_complete": lab_complete,
            "badge_earned": lab.get("badge_reward") if lab_complete else None,
            "next_step": "completed" if lab_complete else "retry"
        }
    
    def get_hint(self, session_id: str, attempt_number: int) -> Dict[str, Any]:
        """
        Get progressive hint based on attempts
        
        Args:
            session_id: Lab session ID
            attempt_number: Current attempt number
            
        Returns:
            Hint object
        """
        if session_id not in self.lab_sessions:
            raise ValueError("Session not found")
        
        session = self.lab_sessions[session_id]
        lab = get_lab_by_id(session["lab_id"])
        
        if not lab:
            raise ValueError("Lab not found")
        
        # Mark hint as used
        session["hint_used"] = True
        
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
    
    def get_user_progress(self, user_id: str) -> Dict[str, Any]:
        """Get user progress and achievements"""
        if user_id not in self.user_progress:
            return {
                "user_id": user_id,
                "total_xp": 0,
                "labs_completed": 0,
                "total_labs": len(get_all_labs()),
                "badges": [],
                "completion_percentage": 0.0,
                "category_progress": {}
            }
        
        return self.user_progress[user_id]
    
    def get_leaderboard(self, limit: int = 10) -> Dict[str, Any]:
        """Get top users by XP"""
        leaderboard = []
        
        for user_id, progress in self.user_progress.items():
            leaderboard.append({
                "user_id": user_id,
                "total_xp": progress["total_xp"],
                "labs_completed": progress["labs_completed"],
                "badges_count": len(progress["badges"]),
                "completion_percentage": progress["completion_percentage"]
            })
        
        # Sort by total XP
        leaderboard.sort(key=lambda x: x["total_xp"], reverse=True)
        
        return {
            "leaderboard": leaderboard[:limit],
            "total_users": len(leaderboard)
        }
    
    def _award_badge(self, user_id: str, badge: str):
        """Award badge to user"""
        if user_id not in self.user_progress:
            return
        
        if badge not in self.user_progress[user_id]["badges"]:
            self.user_progress[user_id]["badges"].append(badge)
    
    def _update_user_progress(self, user_id: str, xp_earned: int, lab_completed: bool):
        """Update user progress"""
        if user_id not in self.user_progress:
            self.user_progress[user_id] = {
                "user_id": user_id,
                "total_xp": 0,
                "labs_completed": 0,
                "total_labs": len(get_all_labs()),
                "badges": [],
                "completion_percentage": 0.0,
                "category_progress": {}
            }
        
        progress = self.user_progress[user_id]
        progress["total_xp"] += xp_earned
        
        if lab_completed:
            progress["labs_completed"] += 1
        
        # Update completion percentage
        progress["completion_percentage"] = (progress["labs_completed"] / progress["total_labs"]) * 100


# Global service instance
attack_lab_service = AttackLabService()