from typing import Dict, Any, Optional


def build_context(project_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Build context object from project data for chatbot
    
    Args:
        project_id: Optional project ID to load specific project context
        
    Returns:
        Context dictionary with project information
    """
    # Lazy import to avoid circular dependency
    from app.services.threat_model_service import threat_results_store, threat_models_store
    
    context = {
        "project": "Unknown",
        "risk": "Unknown",
        "critical_threats": 0,
        "high_threats": 0,
        "medium_threats": 0,
        "low_threats": 0,
        "threats_found": 0,
        "average_score": 0,
        "recommendations": [],
        "top_risks": [],
        "tech_stack": {},
        "github_scan": None
    }
    
    if project_id and project_id in threat_results_store:
        result = threat_results_store[project_id]
        model = threat_models_store.get(project_id, {})
        
        context["project"] = result.get("project", "Unknown")
        context["risk"] = result.get("overall_risk", "Unknown")
        context["threats_found"] = result.get("threats_found", 0)
        context["average_score"] = result.get("average_score", 0)
        
        risk_summary = result.get("risk_summary", {})
        context["critical_threats"] = risk_summary.get("critical", 0)
        context["high_threats"] = risk_summary.get("high", 0)
        context["medium_threats"] = risk_summary.get("medium", 0)
        context["low_threats"] = risk_summary.get("low", 0)
        
        context["recommendations"] = result.get("recommendations", [])
        context["top_risks"] = result.get("top_risks", [])
        
        context["tech_stack"] = {
            "Frontend": model.get("frontend", "N/A"),
            "Backend": model.get("backend", "N/A"),
            "Database": model.get("database", "N/A"),
            "Authentication": model.get("authentication", "N/A"),
            "Cloud": model.get("cloud", "N/A")
        }
    
    return context


def get_threat_recommendation(threat_name: str, recommendations: list) -> Optional[Dict[str, Any]]:
    """Get recommendation for a specific threat"""
    for rec in recommendations:
        if threat_name.lower() in rec.get("threat", "").lower():
            return rec
    return None


def get_critical_threats(recommendations: list) -> list:
    """Get all critical priority recommendations"""
    return [rec for rec in recommendations if rec.get("fix_priority") == "P1"]