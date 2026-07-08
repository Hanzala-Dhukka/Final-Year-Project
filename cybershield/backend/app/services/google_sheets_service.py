import gspread
from google.oauth2.service_account import Credentials
from typing import List, Dict, Any, Optional
import os
from datetime import datetime

# Google Sheets configuration
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

# Initialize Google Sheets client
def get_google_sheets_client():
    """Initialize and return Google Sheets client"""
    try:
        # Check for credentials file path
        creds_path = os.getenv("GOOGLE_CREDS_PATH", "credentials.json")
        
        if not os.path.exists(creds_path):
            # Return None if credentials not found - will use in-memory storage
            return None
            
        credentials = Credentials.from_service_account_file(creds_path, scopes=SCOPES)
        gc = gspread.authorize(credentials)
        return gc
    except Exception as e:
        print(f"Google Sheets client initialization failed: {e}")
        return None


def save_threats_to_sheet(project_id: str, project_name: str, threats: List[Dict[str, Any]], spreadsheet_id: str = None) -> bool:
    """
    Save threats to Google Sheets
    
    Args:
        project_id: Unique project identifier
        project_name: Name of the project
        threats: List of threat objects
        spreadsheet_id: Optional spreadsheet ID (uses env var if not provided)
    
    Returns:
        bool: True if saved successfully, False otherwise
    """
    gc = get_google_sheets_client()
    
    if gc is None:
        # Fall back to in-memory storage
        return False
    
    try:
        # Get spreadsheet
        sheet_id = spreadsheet_id or os.getenv("GOOGLE_SHEETS_ID")
        if not sheet_id:
            return False
            
        sh = gc.open_by_key(sheet_id)
        
        # Try to get ThreatResults worksheet, create if not exists
        try:
            worksheet = sh.worksheet("ThreatResults")
        except gspread.WorksheetNotFound:
            worksheet = sh.add_worksheet(title="ThreatResults", rows=1000, cols=10)
            # Add header row
            worksheet.append_row([
                "Project ID", "Project", "Threat ID", "Technology", 
                "Threat", "Severity", "Category", "Impact", "Recommendation"
            ])
        
        # Append each threat as a row
        for threat in threats:
            worksheet.append_row([
                project_id,
                project_name,
                threat.get("id", ""),
                threat.get("technology", ""),
                threat.get("threat", ""),
                threat.get("severity", ""),
                threat.get("category", ""),
                threat.get("impact", ""),
                threat.get("recommendation", "")
            ])
        
        return True
    except Exception as e:
        print(f"Error saving to Google Sheets: {e}")
        return False


def save_risk_matrix_to_sheet(project_id: str, project_name: str, threats: List[Dict[str, Any]], spreadsheet_id: str = None) -> bool:
    """
    Save risk matrix data to Google Sheets
    
    Args:
        project_id: Unique project identifier
        project_name: Name of the project
        threats: List of threat objects with risk matrix data
        spreadsheet_id: Optional spreadsheet ID (uses env var if not provided)
    
    Returns:
        bool: True if saved successfully, False otherwise
    """
    gc = get_google_sheets_client()
    
    if gc is None:
        # Fall back to in-memory storage
        return False
    
    try:
        # Get spreadsheet
        sheet_id = spreadsheet_id or os.getenv("GOOGLE_SHEETS_ID")
        if not sheet_id:
            return False
            
        sh = gc.open_by_key(sheet_id)
        
        # Try to get ThreatRiskMatrix worksheet, create if not exists
        try:
            worksheet = sh.worksheet("ThreatRiskMatrix")
        except gspread.WorksheetNotFound:
            worksheet = sh.add_worksheet(title="ThreatRiskMatrix", rows=1000, cols=10)
            # Add header row
            worksheet.append_row([
                "Project ID", "Project", "Threat ID", "Likelihood", 
                "Impact", "Score", "Risk Level", "Priority"
            ])
        
        # Append each threat as a row
        for threat in threats:
            worksheet.append_row([
                project_id,
                project_name,
                threat.get("id", ""),
                threat.get("likelihood", 0),
                threat.get("impact", 0),
                threat.get("risk_score", 0),
                threat.get("risk_level", ""),
                threat.get("priority", "")
            ])
        
        return True
    except Exception as e:
        print(f"Error saving risk matrix to Google Sheets: {e}")
        return False


def save_recommendations_to_sheet(project_id: str, project_name: str, recommendations: List[Dict[str, Any]], spreadsheet_id: str = None) -> bool:
    """
    Save recommendations to Google Sheets
    
    Args:
        project_id: Unique project identifier
        project_name: Name of the project
        recommendations: List of recommendation objects
        spreadsheet_id: Optional spreadsheet ID (uses env var if not provided)
    
    Returns:
        bool: True if saved successfully, False otherwise
    """
    gc = get_google_sheets_client()
    
    if gc is None:
        # Fall back to in-memory storage
        return False
    
    try:
        # Get spreadsheet
        sheet_id = spreadsheet_id or os.getenv("GOOGLE_SHEETS_ID")
        if not sheet_id:
            return False
            
        sh = gc.open_by_key(sheet_id)
        
        # Try to get ThreatRecommendations worksheet, create if not exists
        try:
            worksheet = sh.worksheet("ThreatRecommendations")
        except gspread.WorksheetNotFound:
            worksheet = sh.add_worksheet(title="ThreatRecommendations", rows=1000, cols=10)
            # Add header row
            worksheet.append_row([
                "Project ID", "Project", "Threat ID", "Fix Priority", 
                "Recommendation", "Steps", "Code Example"
            ])
        
        # Append each recommendation as a row
        for rec in recommendations:
            steps_str = "; ".join(rec.get("implementation_steps", []))
            worksheet.append_row([
                project_id,
                project_name,
                rec.get("threat_id", ""),
                rec.get("fix_priority", ""),
                rec.get("recommendation", ""),
                steps_str,
                rec.get("code_example", "")
            ])
        
        return True
    except Exception as e:
        print(f"Error saving recommendations to Google Sheets: {e}")
        return False


def save_chat_to_sheet(project_id: str, question: str, answer: str, provider: str = "rule-based", model: str = "rule-based", response_time: float = None, conversation_id: str = None, spreadsheet_id: str = None) -> bool:
    """
    Save chat to Google Sheets
    
    Args:
        project_id: Unique project identifier
        question: User question
        answer: AI answer
        provider: AI provider (Gemini, Fallback, etc.)
        model: AI model name
        response_time: Response time in seconds
        conversation_id: Conversation ID
        spreadsheet_id: Optional spreadsheet ID (uses env var if not provided)
    
    Returns:
        bool: True if saved successfully, False otherwise
    """
    gc = get_google_sheets_client()
    
    if gc is None:
        # Fall back to in-memory storage
        return False
    
    try:
        # Get spreadsheet
        sheet_id = spreadsheet_id or os.getenv("GOOGLE_SHEETS_ID")
        if not sheet_id:
            return False
            
        sh = gc.open_by_key(sheet_id)
        
        # Try to get ChatHistory worksheet, create if not exists
        try:
            worksheet = sh.worksheet("ChatHistory")
        except gspread.WorksheetNotFound:
            worksheet = sh.add_worksheet(title="ChatHistory", rows=1000, cols=8)
            # Add header row
            worksheet.append_row([
                "Conversation ID", "Project ID", "Question", "Answer", "Timestamp", 
                "AI Provider", "Model", "Response Time (s)"
            ])
        
        # Append chat as a row
        worksheet.append_row([
            conversation_id or "",
            project_id,
            question,
            answer,
            datetime.now().isoformat(),
            provider,
            model,
            response_time if response_time else ""
        ])
        
        return True
    except Exception as e:
        print(f"Error saving chat to Google Sheets: {e}")
        return False


def save_conversation_memory(conversation_id: str, project_id: str, user_name: str, messages: list, spreadsheet_id: str = None) -> bool:
    """
    Save conversation memory to Google Sheets
    
    Args:
        conversation_id: Conversation ID
        project_id: Project ID
        user_name: User name
        messages: List of messages
        spreadsheet_id: Optional spreadsheet ID
        
    Returns:
        bool: True if saved successfully, False otherwise
    """
    gc = get_google_sheets_client()
    
    if gc is None:
        return False
    
    try:
        sheet_id = spreadsheet_id or os.getenv("GOOGLE_SHEETS_ID")
        if not sheet_id:
            return False
            
        sh = gc.open_by_key(sheet_id)
        
        # Try to get ConversationMemory worksheet, create if not exists
        try:
            worksheet = sh.worksheet("ConversationMemory")
        except gspread.WorksheetNotFound:
            worksheet = sh.add_worksheet(title="ConversationMemory", rows=1000, cols=6)
            # Add header row
            worksheet.append_row([
                "Conversation ID", "Project ID", "User", "Question", "AI Response", "Timestamp"
            ])
        
        # Append each message as a row
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            timestamp = msg.get("timestamp", datetime.now().isoformat())
            
            if role == "user":
                # For user messages, we need to pair with the next assistant message
                # This is simplified - in production, you'd store pairs
                worksheet.append_row([
                    conversation_id,
                    project_id,
                    user_name,
                    content,
                    "",  # AI response will be added with next message
                    timestamp
                ])
            else:
                # For assistant messages, update the last row with AI response
                # This is a simplified approach
                worksheet.append_row([
                    conversation_id,
                    project_id,
                    user_name,
                    "",  # Question already added
                    content,
                    timestamp
                ])
        
        return True
    except Exception as e:
        print(f"Error saving conversation memory to Google Sheets: {e}")
        return False


def get_threats_from_sheet(project_id: str, spreadsheet_id: str = None) -> List[Dict[str, Any]]:
    """
    Retrieve threats for a project from Google Sheets
    
    Args:
        project_id: Unique project identifier
        spreadsheet_id: Optional spreadsheet ID
    
    Returns:
        List of threat dictionaries
    """
    gc = get_google_sheets_client()
    
    if gc is None:
        return []
    
    try:
        sheet_id = spreadsheet_id or os.getenv("GOOGLE_SHEETS_ID")
        if not sheet_id:
            return []
            
        sh = gc.open_by_key(sheet_id)
        worksheet = sh.worksheet("ThreatResults")
        
        # Get all records
        records = worksheet.get_all_records()
        
        # Filter by project_id
        return [r for r in records if r.get("Project ID") == project_id]
    except Exception as e:
        print(f"Error retrieving from Google Sheets: {e}")
        return []


def save_defense_session_to_sheet(session_id: str, user_id: str, category: str, score: int, status: str, time_taken: int = 0, spreadsheet_id: str = None) -> bool:
    """
    Save defense session to Google Sheets
    
    Args:
        session_id: Unique session identifier
        user_id: User identifier
        category: OWASP category
        score: Score achieved
        status: Passed/Failed/Partial
        time_taken: Time taken in seconds
        spreadsheet_id: Optional spreadsheet ID
    
    Returns:
        bool: True if saved successfully, False otherwise
    """
    gc = get_google_sheets_client()
    
    if gc is None:
        return False
    
    try:
        sheet_id = spreadsheet_id or os.getenv("GOOGLE_SHEETS_ID")
        if not sheet_id:
            return False
            
        sh = gc.open_by_key(sheet_id)
        
        # Try to get DefenseSessions worksheet, create if not exists
        try:
            worksheet = sh.worksheet("DefenseSessions")
        except gspread.WorksheetNotFound:
            worksheet = sh.add_worksheet(title="DefenseSessions", rows=1000, cols=6)
            # Add header row
            worksheet.append_row([
                "Session ID", "User", "Category", "Score", "Status", "Time (s)"
            ])
        
        # Append session as a row
        worksheet.append_row([
            session_id,
            user_id,
            category,
            score,
            status,
            time_taken
        ])
        
        return True
    except Exception as e:
        print(f"Error saving defense session to Google Sheets: {e}")
        return False


def save_attack_lab_to_sheet(lab_id: str, user_id: str, category: str, difficulty: str, score: int, completed: bool, time_taken: int = 0, spreadsheet_id: str = None) -> bool:
    """
    Save attack lab session to Google Sheets
    
    Args:
        lab_id: Lab identifier
        user_id: User identifier
        category: Attack category
        difficulty: Lab difficulty
        score: Score achieved
        completed: Whether lab was completed
        time_taken: Time taken in seconds
        spreadsheet_id: Optional spreadsheet ID
    
    Returns:
        bool: True if saved successfully, False otherwise
    """
    gc = get_google_sheets_client()
    
    if gc is None:
        return False
    
    try:
        sheet_id = spreadsheet_id or os.getenv("GOOGLE_SHEETS_ID")
        if not sheet_id:
            return False
            
        sh = gc.open_by_key(sheet_id)
        
        # Try to get AttackLabs worksheet, create if not exists
        try:
            worksheet = sh.worksheet("AttackLabs")
        except gspread.WorksheetNotFound:
            worksheet = sh.add_worksheet(title="AttackLabs", rows=1000, cols=7)
            # Add header row
            worksheet.append_row([
                "Lab ID", "User", "Category", "Difficulty", "Score", "Completed", "Time (s)"
            ])
        
        # Append lab session as a row
        worksheet.append_row([
            lab_id,
            user_id,
            category,
            difficulty,
            score,
            "Yes" if completed else "No",
            time_taken
        ])
        
        return True
    except Exception as e:
        print(f"Error saving attack lab to Google Sheets: {e}")
        return False


def save_learning_history_to_sheet(
    user_id: str,
    topic: str,
    attempts: int,
    correct: int,
    weakness: str = None,
    skill_level: str = "Beginner",
    last_score: float = 0.0,
    spreadsheet_id: str = None
) -> bool:
    """
    Save learning history to Google Sheets
    
    Args:
        user_id: User identifier
        topic: Topic name
        attempts: Total attempts
        correct: Correct attempts
        weakness: Optional weakness area
        skill_level: User's skill level
        last_score: Last score achieved
        spreadsheet_id: Optional spreadsheet ID
    
    Returns:
        bool: True if saved successfully, False otherwise
    """
    gc = get_google_sheets_client()
    
    if gc is None:
        return False
    
    try:
        sheet_id = spreadsheet_id or os.getenv("GOOGLE_SHEETS_ID")
        if not sheet_id:
            return False
            
        sh = gc.open_by_key(sheet_id)
        
        # Try to get LearningHistory worksheet, create if not exists
        try:
            worksheet = sh.worksheet("LearningHistory")
        except gspread.WorksheetNotFound:
            worksheet = sh.add_worksheet(title="LearningHistory", rows=1000, cols=7)
            # Add header row
            worksheet.append_row([
                "User", "Topic", "Attempts", "Correct", "Weakness", "Skill Level", "Last Updated"
            ])
        
        # Check if user-topic combination already exists
        try:
            records = worksheet.get_all_records()
            row_index = None
            for idx, record in enumerate(records, start=2):  # Start at 2 because row 1 is header
                if record.get("User") == user_id and record.get("Topic") == topic:
                    row_index = idx
                    break
        except Exception:
            row_index = None
        
        # Update or append
        from datetime import datetime
        last_updated = datetime.now().isoformat()
        
        if row_index:
            # Update existing row
            worksheet.update_cell(row_index, 3, attempts)
            worksheet.update_cell(row_index, 4, correct)
            worksheet.update_cell(row_index, 5, weakness or "")
            worksheet.update_cell(row_index, 6, skill_level)
            worksheet.update_cell(row_index, 7, last_updated)
        else:
            # Append new row
            worksheet.append_row([
                user_id,
                topic,
                attempts,
                correct,
                weakness or "",
                skill_level,
                last_updated
            ])
        
        return True
    except Exception as e:
        print(f"Error saving learning history to Google Sheets: {e}")
        return False


def get_learning_history_from_sheet(
    user_id: str,
    topic: str = None,
    spreadsheet_id: str = None
) -> List[Dict[str, Any]]:
    """
    Retrieve learning history from Google Sheets
    
    Args:
        user_id: User identifier
        topic: Optional topic filter
        spreadsheet_id: Optional spreadsheet ID
    
    Returns:
        List of learning history records
    """
    gc = get_google_sheets_client()
    
    if gc is None:
        return []
    
    try:
        sheet_id = spreadsheet_id or os.getenv("GOOGLE_SHEETS_ID")
        if not sheet_id:
            return []
            
        sh = gc.open_by_key(sheet_id)
        
        try:
            worksheet = sh.worksheet("LearningHistory")
        except gspread.WorksheetNotFound:
            return []
        
        # Get all records
        records = worksheet.get_all_records()
        
        # Filter by user_id
        user_records = [r for r in records if r.get("User") == user_id]
        
        # Filter by topic if provided
        if topic:
            user_records = [r for r in user_records if r.get("Topic") == topic]
        
        return user_records
    except Exception as e:
        print(f"Error retrieving learning history from Google Sheets: {e}")
        return []


def save_daily_challenge_to_sheet(
    challenge_id: str,
    date: str,
    category: str,
    difficulty: str,
    title: str,
    description: str,
    question: str,
    answer: str,
    xp_reward: int,
    streak_bonus: int = 0,
    hint: str = "",
    spreadsheet_id: str = None
) -> bool:
    """
    Save daily challenge to Google Sheets
    
    Args:
        challenge_id: Unique challenge identifier
        date: Date string (YYYY-MM-DD)
        category: Challenge category
        difficulty: Challenge difficulty
        title: Challenge title
        description: Challenge description
        question: Challenge question
        answer: Correct answer
        xp_reward: XP reward amount
        streak_bonus: Streak bonus amount
        hint: Optional hint
        spreadsheet_id: Optional spreadsheet ID
    
    Returns:
        bool: True if saved successfully, False otherwise
    """
    gc = get_google_sheets_client()
    
    if gc is None:
        return False
    
    try:
        sheet_id = spreadsheet_id or os.getenv("GOOGLE_SHEETS_ID")
        if not sheet_id:
            return False
            
        sh = gc.open_by_key(sheet_id)
        
        # Try to get DailyChallenges worksheet, create if not exists
        try:
            worksheet = sh.worksheet("DailyChallenges")
        except gspread.WorksheetNotFound:
            worksheet = sh.add_worksheet(title="DailyChallenges", rows=1000, cols=10)
            # Add header row
            worksheet.append_row([
                "Challenge ID", "Date", "Category", "Difficulty", "Title",
                "Description", "Question", "Answer", "XP", "Streak Bonus",
                "Hint", "Created At"
            ])
        
        # Append challenge as a row
        worksheet.append_row([
            challenge_id,
            date,
            category,
            difficulty,
            title,
            description,
            question,
            answer,
            xp_reward,
            streak_bonus,
            hint,
            datetime.now().isoformat()
        ])
        
        return True
    except Exception as e:
        print(f"Error saving daily challenge to Google Sheets: {e}")
        return False


# Progress Tracking Functions
def save_user_progress_to_sheet(user_id: str, xp: int, level: int, labs: int, 
                               avg_score: float, last_login: str, spreadsheet_id: str = None) -> bool:
    """
    Save user progress to Google Sheets
    
    Args:
        user_id: User identifier
        xp: Total XP
        level: Current level
        labs: Completed labs count
        avg_score: Average score
        last_login: Last login timestamp
        spreadsheet_id: Optional spreadsheet ID
    
    Returns:
        bool: True if saved successfully, False otherwise
    """
    gc = get_google_sheets_client()
    
    if gc is None:
        return False
    
    try:
        sheet_id = spreadsheet_id or os.getenv("GOOGLE_SHEETS_ID")
        if not sheet_id:
            return False
            
        sh = gc.open_by_key(sheet_id)
        
        # Try to get UserProgress worksheet, create if not exists
        try:
            worksheet = sh.worksheet("UserProgress")
        except gspread.WorksheetNotFound:
            worksheet = sh.add_worksheet(title="UserProgress", rows=1000, cols=7)
            # Add header row
            worksheet.append_row([
                "User", "XP", "Level", "Skill", "Labs", "Avg Score", "Last Login"
            ])
        
        # Check if user already exists
        try:
            records = worksheet.get_all_records()
            row_index = None
            for idx, record in enumerate(records, start=2):
                if record.get("User") == user_id:
                    row_index = idx
                    break
        except Exception:
            row_index = None
        
        # Update or append
        if row_index:
            worksheet.update_cell(row_index, 2, xp)
            worksheet.update_cell(row_index, 3, level)
            worksheet.update_cell(row_index, 5, labs)
            worksheet.update_cell(row_index, 6, avg_score)
            worksheet.update_cell(row_index, 7, last_login)
        else:
            skill = _get_skill_from_xp(xp, avg_score, labs)
            worksheet.append_row([
                user_id,
                xp,
                level,
                skill,
                labs,
                avg_score,
                last_login
            ])
        
        return True
    except Exception as e:
        print(f"Error saving user progress to Google Sheets: {e}")
        return False


def get_user_progress_from_sheet(user_id: str, spreadsheet_id: str = None) -> Optional[Dict[str, Any]]:
    """
    Get user progress from Google Sheets
    
    Args:
        user_id: User identifier
        spreadsheet_id: Optional spreadsheet ID
    
    Returns:
        User progress data or None
    """
    gc = get_google_sheets_client()
    
    if gc is None:
        return None
    
    try:
        sheet_id = spreadsheet_id or os.getenv("GOOGLE_SHEETS_ID")
        if not sheet_id:
            return None
            
        sh = gc.open_by_key(sheet_id)
        
        try:
            worksheet = sh.worksheet("UserProgress")
        except gspread.WorksheetNotFound:
            return None
        
        records = worksheet.get_all_records()
        
        for record in records:
            if record.get("User") == user_id:
                return {
                    "total_xp": int(record.get("XP", 0)),
                    "level": int(record.get("Level", 1)),
                    "completed_labs": int(record.get("Labs", 0)),
                    "average_score": float(record.get("Avg Score", 0.0)),
                    "last_login": record.get("Last Login", "")
                }
        
        return None
    except Exception as e:
        print(f"Error getting user progress from Google Sheets: {e}")
        return None


def save_achievement_to_sheet(user_id: str, badge: str, date: str, spreadsheet_id: str = None) -> bool:
    """
    Save achievement to Google Sheets
    
    Args:
        user_id: User identifier
        badge: Badge name
        date: Date earned
        spreadsheet_id: Optional spreadsheet ID
    
    Returns:
        bool: True if saved successfully, False otherwise
    """
    gc = get_google_sheets_client()
    
    if gc is None:
        return False
    
    try:
        sheet_id = spreadsheet_id or os.getenv("GOOGLE_SHEETS_ID")
        if not sheet_id:
            return False
            
        sh = gc.open_by_key(sheet_id)
        
        # Try to get Achievements worksheet, create if not exists
        try:
            worksheet = sh.worksheet("Achievements")
        except gspread.WorksheetNotFound:
            worksheet = sh.add_worksheet(title="Achievements", rows=1000, cols=3)
            # Add header row
            worksheet.append_row([
                "User", "Badge", "Date"
            ])
        
        worksheet.append_row([
            user_id,
            badge,
            date
        ])
        
        return True
    except Exception as e:
        print(f"Error saving achievement to Google Sheets: {e}")
        return False


def save_certificate_to_sheet(user_id: str, certificate_id: str, course: str, 
                            date: str, spreadsheet_id: str = None) -> bool:
    """
    Save certificate to Google Sheets
    
    Args:
        user_id: User identifier
        certificate_id: Certificate ID
        course: Course name
        date: Date issued
        spreadsheet_id: Optional spreadsheet ID
    
    Returns:
        bool: True if saved successfully, False otherwise
    """
    gc = get_google_sheets_client()
    
    if gc is None:
        return False
    
    try:
        sheet_id = spreadsheet_id or os.getenv("GOOGLE_SHEETS_ID")
        if not sheet_id:
            return False
            
        sh = gc.open_by_key(sheet_id)
        
        # Try to get Certificates worksheet, create if not exists
        try:
            worksheet = sh.worksheet("Certificates")
        except gspread.WorksheetNotFound:
            worksheet = sh.add_worksheet(title="Certificates", rows=1000, cols=4)
            # Add header row
            worksheet.append_row([
                "User", "Certificate ID", "Course", "Date"
            ])
        
        worksheet.append_row([
            user_id,
            certificate_id,
            course,
            date
        ])
        
        return True
    except Exception as e:
        print(f"Error saving certificate to Google Sheets: {e}")
        return False


def _get_skill_from_xp(xp: int, avg_score: float, labs: int) -> str:
    """Determine skill level from XP and stats"""
    if avg_score >= 90 and labs >= 40 and xp >= 5000:
        return "Security Professional"
    elif avg_score >= 80 and labs >= 20:
        return "Expert"
    elif avg_score >= 60 and labs >= 10:
        return "Advanced"
    elif avg_score >= 40 and labs >= 5:
        return "Intermediate"
    else:
        return "Beginner"


def get_all_users_progress(spreadsheet_id: str = None) -> List[Dict[str, Any]]:
    """
    Get all users progress from Google Sheets
    
    Args:
        spreadsheet_id: Optional spreadsheet ID
    
    Returns:
        List of all user progress records
    """
    gc = get_google_sheets_client()
    
    if gc is None:
        return []
    
    try:
        sheet_id = spreadsheet_id or os.getenv("GOOGLE_SHEETS_ID")
        if not sheet_id:
            return []
            
        sh = gc.open_by_key(sheet_id)
        
        try:
            worksheet = sh.worksheet("UserProgress")
        except gspread.WorksheetNotFound:
            return []
        
        records = worksheet.get_all_records()
        
        return [
            {
                "user_id": record.get("User"),
                "total_xp": int(record.get("XP", 0)),
                "level": int(record.get("Level", 1)),
                "completed_labs": int(record.get("Labs", 0)),
                "average_score": float(record.get("Avg Score", 0.0))
            }
            for record in records
        ]
    except Exception as e:
        print(f"Error getting all users progress from Google Sheets: {e}")
        return []
