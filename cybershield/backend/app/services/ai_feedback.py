from typing import Dict, Any, List, Optional
from app.services.gemini_service import generate_ai_response, get_model
from app.config.settings import settings


class AIFeedbackEngine:
    """Generate AI-powered feedback for defense submissions"""
    
    @staticmethod
    def generate_feedback(
        category: str,
        user_code: str,
        validation_result: Dict[str, Any],
        scenario: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive AI feedback for user's defense code
        
        Args:
            category: OWASP category
            user_code: User's submitted code
            validation_result: Result from defense validator
            scenario: The defense scenario
            
        Returns:
            Enhanced feedback with AI insights
        """
        # Get base feedback from validator
        score = validation_result.get("score", 0)
        status = validation_result.get("status", "Failed")
        feedback_lines = validation_result.get("feedback", "").split("\n")
        best_practices = validation_result.get("best_practices", [])
        
        # Try to get AI-enhanced feedback
        ai_feedback = AIFeedbackEngine._get_ai_feedback(
            category, user_code, validation_result, scenario
        )
        
        # Combine validator feedback with AI feedback
        if ai_feedback:
            # Use AI feedback if available
            enhanced_feedback = ai_feedback.get("feedback", feedback_lines)
            enhanced_recommendation = ai_feedback.get("recommendation", "")
            enhanced_best_practices = list(set(best_practices + ai_feedback.get("best_practices", [])))
        else:
            # Fallback to rule-based feedback
            enhanced_feedback = feedback_lines
            enhanced_recommendation = AIFeedbackEngine._generate_recommendation(
                category, score, status
            )
            enhanced_best_practices = best_practices
        
        # Calculate bonus points
        bonus_points = 0
        if score >= 80:
            bonus_points += 10  # Best practice bonus
        if len(enhanced_best_practices) >= 3:
            bonus_points += 10  # Multiple best practices
        
        total_score = min(100, score + bonus_points)
        
        return {
            "score": total_score,
            "status": status,
            "feedback": "\n".join(enhanced_feedback) if isinstance(enhanced_feedback, list) else enhanced_feedback,
            "recommendation": enhanced_recommendation,
            "owasp_reference": scenario.get("owasp", "N/A"),
            "best_practices": enhanced_best_practices,
            "secure_code_example": scenario.get("secure_example", ""),
            "bonus_points": bonus_points,
            "ai_enhanced": ai_feedback is not None
        }
    
    @staticmethod
    def _get_ai_feedback(
        category: str,
        user_code: str,
        validation_result: Dict[str, Any],
        scenario: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Get AI-generated feedback using Gemini"""
        try:
            model = get_model()
            if not model:
                return None
            
            # Build prompt for AI feedback
            prompt = f"""You are a security expert providing feedback on code that defends against {category}.

Vulnerable Code:
{scenario.get('vulnerable_code', 'N/A')}

User's Defense Code:
{user_code}

Validation Result:
- Score: {validation_result.get('score', 0)}
- Status: {validation_result.get('status', 'Unknown')}
- Feedback: {validation_result.get('feedback', 'N/A')}

Provide constructive feedback in JSON format:
{{
  "feedback": "Detailed feedback on the user's code (2-3 sentences)",
  "recommendation": "Specific recommendation for improvement",
  "best_practices": ["practice1", "practice2", "practice3"]
}}

Focus on:
1. What the user did well
2. What could be improved
3. Industry best practices
4. OWASP guidelines

Return only valid JSON:"""
            
            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.3,
                    "max_output_tokens": 500
                }
            )
            
            # Parse AI response
            response_text = response.text.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            import json
            ai_feedback = json.loads(response_text)
            return ai_feedback
        
        except Exception as e:
            print(f"Error getting AI feedback: {e}")
            return None
    
    @staticmethod
    def _generate_recommendation(category: str, score: int, status: str) -> str:
        """Generate rule-based recommendation"""
        recommendations = {
            "SQL Injection": {
                "Passed": "Excellent work! Continue using parameterized queries for all database operations.",
                "Partial": "Good start! Make sure to use parameterized queries with placeholders (?) for all user inputs.",
                "Failed": "Critical: Never concatenate user input into SQL queries. Use parameterized queries or prepared statements."
            },
            "XSS": {
                "Passed": "Great job! You've implemented proper XSS protection. Remember to use CSP headers for defense in depth.",
                "Partial": "Good effort! Use html.escape() for all user-generated content and consider implementing CSP headers.",
                "Failed": "Critical: Always escape user input before outputting to HTML. Use html.escape() or a templating engine with auto-escaping."
            },
            "Command Injection": {
                "Passed": "Excellent! Using subprocess with shell=False is the correct approach. Always validate and whitelist inputs.",
                "Partial": "Good! Use subprocess.run() or subprocess.call() with shell=False and pass arguments as a list.",
                "Failed": "Critical: Never use os.system() with user input. Use subprocess with shell=False and argument lists."
            },
            "Path Traversal": {
                "Passed": "Perfect! You're using pathlib with proper validation. Continue using resolve() and startswith() checks.",
                "Partial": "Good! Use pathlib.Path for path operations, call resolve() to get canonical path, and validate with startswith().",
                "Failed": "Critical: Never trust user input for file paths. Use pathlib, resolve paths, and validate they're within allowed directories."
            }
        }
        
        category_recs = recommendations.get(category, {})
        return category_recs.get(status, "Review the secure code example and try again.")
    
    @staticmethod
    def generate_hint(category: str, scenario_id: str, hint_level: int = 1) -> str:
        """
        Generate progressive hints for a scenario
        
        Args:
            category: OWASP category
            scenario_id: Scenario ID
            hint_level: 1-3 (1=subtle, 2=moderate, 3=direct)
            
        Returns:
            Hint text
        """
        from app.data.defense_scenarios import get_scenario_by_id
        
        scenario = get_scenario_by_id(scenario_id)
        if not scenario:
            return "No hints available for this scenario."
        
        hints = scenario.get("hints", [])
        
        if hint_level > len(hints):
            return hints[-1] if hints else "Review the secure code example."
        
        return hints[hint_level - 1]
    
    @staticmethod
    def explain_owasp(category: str) -> str:
        """Generate OWASP explanation for a category"""
        explanations = {
            "SQL Injection": """
A03:2021 – Injection

SQL Injection occurs when untrusted user data is sent to an interpreter as part of a command or query. The attacker's hostile data can trick the interpreter into executing unintended commands or accessing unauthorized data.

Impact:
- Data breach and unauthorized access
- Data loss or corruption
- Authentication bypass
- Complete system compromise

Prevention:
- Use parameterized queries
- Implement proper input validation
- Use ORM frameworks
- Apply principle of least privilege
            """.strip(),
            
            "XSS": """
A03:2021 – Injection

Cross-Site Scripting (XSS) occurs when untrusted data is included in a web page without proper validation or escaping. Attackers can execute malicious scripts in the victim's browser.

Impact:
- Session hijacking and cookie theft
- Defacement of websites
- Malware distribution
- Phishing attacks

Prevention:
- Use html.escape() for output encoding
- Implement Content Security Policy (CSP)
- Use modern frameworks with auto-escaping
- Sanitize user input with DOMPurify
            """.strip(),
            
            "Command Injection": """
A03:2021 – Injection

Command Injection occurs when user input is passed to system shells without proper validation. Attackers can execute arbitrary system commands.

Impact:
- Complete server compromise
- Data theft or destruction
- Lateral movement in network
- System takeover

Prevention:
- Use subprocess with shell=False
- Pass arguments as a list
- Validate and whitelist inputs
- Avoid os.system() entirely
            """.strip(),
            
            "Path Traversal": """
A01:2021 – Broken Access Control

Path Traversal (Directory Traversal) occurs when user input is used to construct file paths without validation. Attackers can access files outside the intended directory.

Impact:
- Unauthorized file access
- Source code disclosure
- Configuration file exposure
- System file access

Prevention:
- Use pathlib for path operations
- Resolve paths to canonical form
- Validate paths with startswith()
- Use basename() to extract filenames
            """.strip()
        }
        
        return explanations.get(category, "No explanation available for this category.")