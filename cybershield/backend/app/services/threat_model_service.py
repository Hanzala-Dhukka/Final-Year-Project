
import uuid
from datetime import datetime
from typing import Dict, Any, List
from app.models.threat_model import ThreatModelCreate
from app.services.threat_engine import generate_threats
from app.services.risk_matrix import process_threats_with_risk_matrix
from app.services.recommendation_engine import generate_recommendations, generate_fix_plan, generate_security_report
from app.services.google_sheets_service import save_threats_to_sheet, save_risk_matrix_to_sheet, save_recommendations_to_sheet

# In-memory storage for threat models and results
threat_models_store: Dict[str, Dict[str, Any]] = {}
threat_results_store: Dict[str, Any] = {}


def create_threat_model(data: ThreatModelCreate) -> Dict[str, Any]:
    project_id = str(uuid.uuid4())[:8]  # Short UUID like "8d1d7f64"
    now = datetime.utcnow().isoformat()
    
    # Save project info
    model_data = {
        "id": project_id,
        "project_name": data.project_name,
        "description": data.description,
        "frontend": data.frontend,
        "backend": data.backend,
        "database": data.database,
        "authentication": data.authentication,
        "cloud": data.cloud,
        "third_party": data.third_party,
        "assets": data.assets,
        "created_at": now,
    }
    threat_models_store[project_id] = model_data
    
    # Generate threats using the threat engine
    threat_result = generate_threats(model_data)
    threat_result["project_id"] = project_id
    
    # Process threats with risk matrix
    risk_result = process_threats_with_risk_matrix(threat_result.get("threats", []))
    
    # Generate recommendations
    recommendations = generate_recommendations(risk_result.get("threats", []))
    
    # Generate fix plan
    fix_plan = generate_fix_plan(risk_result.get("threats", []))
    
    # Generate security report
    security_report = generate_security_report(
        data.project_name,
        risk_result.get("threats", []),
        risk_result.get("risk_summary", {})
    )
    
    # Combine results
    final_result = {
        "project_id": project_id,
        "project": threat_result["project"],
        "threats_found": threat_result["threats_found"],
        "risk_level": threat_result["risk_level"],
        "overall_risk": risk_result["overall_risk"],
        "average_score": risk_result["average_score"],
        "risk_summary": risk_result["risk_summary"],
        "top_risks": risk_result["top_risks"],
        "threats": risk_result["threats"],
        "recommendations": recommendations,
        "fix_plan": fix_plan,
        "security_report": security_report
    }
    
    # Store threat results
    threat_results_store[project_id] = final_result
    
    # Save threats to Google Sheets
    save_threats_to_sheet(
        project_id=project_id,
        project_name=data.project_name,
        threats=risk_result.get("threats", [])
    )
    
    # Save risk matrix to Google Sheets
    save_risk_matrix_to_sheet(
        project_id=project_id,
        project_name=data.project_name,
        threats=risk_result.get("threats", [])
    )
    
    # Save recommendations to Google Sheets
    save_recommendations_to_sheet(
        project_id=project_id,
        project_name=data.project_name,
        recommendations=recommendations
    )
    
    return final_result


