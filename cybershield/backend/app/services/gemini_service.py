import json
import time
import warnings
from typing import Dict, Any, Optional

# Try to import Gemini AI, fallback to None if not available
try:
    # Try new package first (google.genai)
    try:
        from google import genai
        GEMINI_AVAILABLE = True
        USING_NEW_API = True
    except ImportError:
        # Fallback to old package (google.generativeai) - suppress deprecation warning
        warnings.filterwarnings('ignore', category=FutureWarning, module='google.generativeai')
        import google.generativeai as genai
        GEMINI_AVAILABLE = True
        USING_NEW_API = False
except ImportError:
    print("Warning: google-generativeai not installed. Using fallback mode.")
    genai = None
    GEMINI_AVAILABLE = False
    USING_NEW_API = False

from app.config.settings import settings


# Initialize Gemini client once at module level
_genai_configured = False
_model = None


def initialize_gemini():
    """
    Initialize Gemini AI client
    Should be called once when application starts
    """
    global _genai_configured, _model
    
    if _genai_configured:
        return _model
    
    try:
        # Check if Gemini is available
        if not GEMINI_AVAILABLE or genai is None:
            print("Warning: Gemini AI not available (package not installed). Using fallback mode.")
            return None
        
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your-gemini-api-key-here":
            print("Warning: GEMINI_API_KEY not set. Using fallback mode.")
            return None
        
        # Configure Gemini based on API version
        if USING_NEW_API:
            # New API (google.genai)
            _model = genai.GenerativeModel(settings.AI_MODEL)
        else:
            # Old API (google.generativeai)
            genai.configure(api_key=settings.GEMINI_API_KEY)
            _model = genai.GenerativeModel(settings.AI_MODEL)
        
        _genai_configured = True
        print(f"✅ Gemini AI initialized successfully with model: {settings.AI_MODEL}")
        return _model
    
    except Exception as e:
        print(f"Error initializing Gemini: {str(e)}")
        return None


def get_model():
    """Get or initialize the Gemini model"""
    global _model
    if _model is None:
        _model = initialize_gemini()
    return _model


async def generate_ai_response(
    question: str,
    project_context: Dict[str, Any],
    max_retries: int = 3
) -> Dict[str, Any]:
    """
    Generate AI response using Gemini
    
    Args:
        question: User's question
        project_context: Project context including threats, risk, etc.
        max_retries: Maximum number of retries on failure
        
    Returns:
        Dictionary with AI response or fallback response
    """
    model = get_model()
    
    if not model:
        # Fallback to rule-based chatbot
        print("Gemini not available, using fallback mode")
        from app.services.chatbot_service import generate_answer as fallback_answer
        fallback = fallback_answer(question, project_context.get("project_id"))
        return {
            "provider": "Fallback",
            "model": "rule-based",
            "answer": {
                "title": "Rule-Based Response",
                "summary": fallback["answer"],
                "business_impact": "N/A",
                "recommendation": fallback["answer"],
                "implementation_steps": [],
                "secure_code": "# Configure Gemini API key for AI-powered responses"
            }
        }
    
    try:
        # Build prompt with context
        from app.services.prompt_builder import build_prompt
        prompt = build_prompt(question, project_context)
        
        # Generate response with retry logic
        for attempt in range(max_retries):
            try:
                start_time = time.time()
                
                # Generate response (API is the same for both versions)
                response = model.generate_content(prompt)
                
                response_time = time.time() - start_time
                
                # Parse JSON response
                response_text = response.text.strip()
                
                # Try to extract JSON from response
                try:
                    # Remove markdown code blocks if present
                    if "```json" in response_text:
                        response_text = response_text.split("```json")[1].split("```")[0].strip()
                    elif "```" in response_text:
                        response_text = response_text.split("```")[1].split("```")[0].strip()
                    
                    answer_data = json.loads(response_text)
                    
                    return {
                        "provider": "Gemini",
                        "model": settings.AI_MODEL,
                        "response_time": round(response_time, 2),
                        "answer": answer_data
                    }
                
                except json.JSONDecodeError:
                    # If JSON parsing fails, wrap the text response
                    return {
                        "provider": "Gemini",
                        "model": settings.AI_MODEL,
                        "response_time": round(response_time, 2),
                        "answer": {
                            "title": "AI Response",
                            "summary": response_text,
                            "business_impact": "See summary",
                            "recommendation": response_text,
                            "implementation_steps": [],
                            "secure_code": ""
                        }
                    }
            
            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"Gemini API error (attempt {attempt + 1}/{max_retries}): {str(e)}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    raise e
    
    except Exception as e:
        print(f"Gemini API failed after {max_retries} retries: {str(e)}")
        # Fallback to rule-based chatbot
        from app.services.chatbot_service import generate_answer as fallback_answer
        fallback = fallback_answer(question, project_context.get("project_id"))
        return {
            "provider": "Fallback",
            "model": "rule-based",
            "error": str(e),
            "answer": {
                "title": "Rule-Based Response (Fallback)",
                "summary": fallback["answer"],
                "business_impact": "N/A",
                "recommendation": fallback["answer"],
                "implementation_steps": [],
                "secure_code": "# Configure Gemini API key for AI-powered responses"
            }
        }


async def generate_daily_explanation(
    category: str,
    title: str,
    user_answer: str
) -> str:
    """
    Generate AI explanation for daily challenge
    
    Args:
        category: Challenge category (e.g., "SQL Injection")
        title: Challenge title
        user_answer: User's submitted answer
    
    Returns:
        Explanation string
    """
    model = get_model()
    
    if not model:
        # Return fallback explanation
        return f"""
Today's challenge demonstrated {category}.

Why it worked:
The payload you submitted exploited a vulnerability in the application's input validation.

How to prevent it:
- Use parameterized queries/prepared statements
- Implement proper input validation
- Apply the principle of least privilege
- Use Web Application Firewalls (WAF)

Industry Example:
Many major breaches have occurred due to {category} vulnerabilities, including the famous TalkTalk breach.

Related OWASP Category:
A03:2021 - Injection
"""
    
    try:
        prompt = f"""
You are a cybersecurity expert explaining a daily challenge to a learner.

Challenge Category: {category}
Challenge Title: {title}
User's Answer: {user_answer}

Provide a comprehensive explanation in this format:

1. **What this challenge demonstrated**: Explain the vulnerability in simple terms.

2. **Why it worked**: Explain why the user's answer was correct or what the vulnerability allows.

3. **How to prevent it**: Provide 3-4 specific prevention techniques.

4. **Industry Example**: Give a real-world example of this vulnerability being exploited.

5. **Related OWASP Category**: Reference the specific OWASP Top 10 category.

Keep the explanation educational, clear, and actionable. Use bullet points and code examples where appropriate.
"""
        
        response = model.generate_content(prompt)
        return response.text.strip()
        
    except Exception as e:
        print(f"Error generating daily explanation: {str(e)}")
        return f"""
Today's challenge demonstrated {category}.

Why it worked:
The payload you submitted exploited a vulnerability in the application's input validation.

How to prevent it:
- Use parameterized queries/prepared statements
- Implement proper input validation
- Apply the principle of least privilege
- Use Web Application Firewalls (WAF)

Industry Example:
Many major breaches have occurred due to {category} vulnerabilities.

Related OWASP Category:
A03:2021 - Injection
"""