import gspread
from google.oauth2.service_account import Credentials
from typing import List, Dict, Any
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
