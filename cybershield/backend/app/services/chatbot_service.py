import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from app.services.context_builder import build_context, get_threat_recommendation, get_critical_threats
from app.services.chatbot_knowledge import (
    OWASP_KNOWLEDGE,
    SECURE_CODING_KNOWLEDGE,
    CLOUD_SECURITY_KNOWLEDGE,
    GITHUB_SECURITY_KNOWLEDGE,
    get_knowledge_by_topic
)

# In-memory chat history
chat_history_store: Dict[str, list] = {}


def detect_intent(question: str) -> str:
    """
    Detect the intent of the question
    
    Returns:
        Intent type: "recommendation", "owasp", "glossary", "risk_analysis", "project_summary", "unknown"
    """
    question_lower = question.lower()
    
    # Recommendation intent
    if any(word in question_lower for word in ["fix", "how to", "how do i", "remediate", "mitigate", "solve"]):
        return "recommendation"
    
    # OWASP/Glossary intent
    if any(word in question_lower for word in ["what is", "define", "explain", "meaning of"]):
        return "glossary"
    
    # Risk analysis intent
    if any(word in question_lower for word in ["risk", "score", "grade", "high", "critical", "low"]):
        return "risk_analysis"
    
    # Project summary intent
    if any(word in question_lower for word in ["project", "threats", "vulnerabilities", "summary"]):
        return "project_summary"
    
    return "unknown"


def generate_answer(question: str, project_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Generate answer based on question and project context
    
    Args:
        question: User's question
        project_id: Optional project ID for context
        
    Returns:
        Answer dictionary with response and source
    """
    context = build_context(project_id)
    intent = detect_intent(question)
    question_lower = question.lower()
    
    # Check for specific threat in question
    threat_keywords = ["jwt", "s3", "xss", "sql injection", "csrf", "ssrf", "authentication", "cors", "rate limiting"]
    for keyword in threat_keywords:
        if keyword in question_lower:
            # Check if it's a recommendation request
            if intent == "recommendation":
                rec = get_threat_recommendation(keyword, context.get("recommendations", []))
                if rec:
                    steps = "\n".join([f"• {step}" for step in rec.get("implementation_steps", [])])
                    return {
                        "answer": f"{rec.get('recommendation', '')}\n\nImplementation steps:\n{steps}",
                        "source": "Threat Recommendation Engine"
                    }
            
            # Check knowledge base
            knowledge = get_knowledge_by_topic(keyword)
            if knowledge:
                if "prevention" in knowledge["data"]:
                    steps = "\n".join([f"• {step}" for step in knowledge["data"]["prevention"]])
                    return {
                        "answer": f"{knowledge['data'].get('definition', '')}\n\nPrevention:\n{steps}",
                        "source": f"{knowledge['type']} Knowledge Base"
                    }
                elif "best_practices" in knowledge["data"]:
                    steps = "\n".join([f"• {step}" for step in knowledge["data"]["best_practices"]])
                    return {
                        "answer": f"{knowledge['data'].get('description', '')}\n\nBest practices:\n{steps}",
                        "source": f"{knowledge['type']} Knowledge Base"
                    }
    
    # Handle different intents
    if intent == "project_summary":
        if context["project"] != "Unknown":
            return {
                "answer": f"Your project '{context['project']}' has {context['threats_found']} threats with an average risk score of {context['average_score']}. Overall risk level: {context['risk']}.",
                "source": "Project Summary"
            }
        return {
            "answer": "No project context available. Please create a threat model first.",
            "source": "System"
        }
    
    if intent == "risk_analysis":
        if context["project"] != "Unknown":
            critical = get_critical_threats(context.get("recommendations", []))
            critical_names = [rec.get("threat", "") for rec in critical[:3]]
            
            return {
                "answer": f"Your project is {context['risk']} risk because:\n• {context['critical_threats']} Critical threats\n• {context['high_threats']} High threats\n• {context['medium_threats']} Medium threats\n\nAverage Risk Score: {context['average_score']}\n\nTop critical threats: {', '.join(critical_names) if critical_names else 'None identified'}",
                "source": "Risk Analysis"
            }
        return {
            "answer": "No project context available for risk analysis.",
            "source": "System"
        }
    
    if intent == "glossary":
        knowledge = get_knowledge_by_topic(question)
        if knowledge:
            if "prevention" in knowledge["data"]:
                return {
                    "answer": knowledge["data"].get("definition", ""),
                    "source": f"{knowledge['type']} Knowledge Base"
                }
            elif "best_practices" in knowledge["data"]:
                return {
                    "answer": knowledge["data"].get("description", ""),
                    "source": f"{knowledge['type']} Knowledge Base"
                }
    
    # Default response
    return {
        "answer": "I can help you with security questions about your project. Try asking about specific threats, OWASP topics, or how to fix vulnerabilities.",
        "source": "System"
    }


def save_chat(project_id: str, question: str, answer: str) -> str:
    """
    Save chat to history
    
    Args:
        project_id: Project ID
        question: User question
        answer: AI answer
        
    Returns:
        Chat ID
    """
    chat_id = str(uuid.uuid4())[:8]
    
    if project_id not in chat_history_store:
        chat_history_store[project_id] = []
    
    chat_history_store[project_id].append({
        "chat_id": chat_id,
        "project_id": project_id,
        "question": question,
        "answer": answer,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return chat_id


def get_chat_history(project_id: str) -> list:
    """Get chat history for a project"""
    return chat_history_store.get(project_id, [])