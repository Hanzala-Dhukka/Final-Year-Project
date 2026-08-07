
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.models.threat_model import ThreatModelCreate
from app.services.threat_engine import generate_threats
from app.services.risk_matrix import process_threats_with_risk_matrix

logger = logging.getLogger(__name__)

# In-memory storage for threat models and results
threat_models_store: Dict[str, Dict[str, Any]] = {}
threat_results_store: Dict[str, Any] = {}


async def create_threat_model(data: ThreatModelCreate, user_id: Optional[str] = None) -> Dict[str, Any]:
    project_id = str(uuid.uuid4())[:8]
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

    # Generate threats using AI (with rule-based fallback)
    threat_result = await generate_threats(model_data)
    threat_result["project_id"] = project_id

    # Process threats with risk matrix
    risk_result = process_threats_with_risk_matrix(threat_result.get("threats", []))

    # Generate AI-powered recommendations, fix plan, and security report
    from app.services.recommendation_engine import (
        generate_recommendations,
        generate_fix_plan,
        generate_security_report,
    )

    # Build project context for AI prompts
    project_ctx = {
        "project_name": data.project_name,
        "description": data.description or "",
        "frontend": data.frontend,
        "backend": data.backend,
        "database": data.database,
        "authentication": data.authentication,
        "cloud": data.cloud,
        "third_party": data.third_party,
        "assets": data.assets,
    }

    recommendations = await generate_recommendations(risk_result.get("threats", []), project=project_ctx)
    fix_plan = await generate_fix_plan(risk_result.get("threats", []), project=project_ctx)
    security_report = await generate_security_report(
        data.project_name,
        risk_result.get("threats", []),
        risk_result.get("risk_summary", {}),
        risk_level=risk_result.get("overall_risk", "Medium"),
        project=project_ctx,
    )

    # Combine results
    final_result = {
        "project_id": project_id,
        "project": {
            "name": data.project_name,
            "frontend": data.frontend,
            "backend": data.backend,
            "database": data.database,
            "authentication": data.authentication,
            "cloud": data.cloud,
            "description": data.description,
        },
        "threats_found": threat_result["threats_found"],
        "risk_level": threat_result["risk_level"],
        "overall_risk": risk_result["overall_risk"],
        "average_score": risk_result["average_score"],
        "risk_summary": risk_result["risk_summary"],
        "top_risks": risk_result["top_risks"],
        "threats": risk_result["threats"],
        "recommendations": recommendations,
        "fix_plan": fix_plan,
        "security_report": security_report,
    }

    # Store threat results
    threat_results_store[project_id] = final_result

    # Persist to MongoDB so the Threat Reports page can list it
    if user_id:
        try:
            from app.database.db import database
            from bson import ObjectId

            threat_report_doc = {
                "user_id": ObjectId(user_id),
                "project_name": data.project_name,
                "description": data.description or "",
                "project_id": project_id,
                "risk_level": risk_result.get("overall_risk", "Medium"),
                "security_score": risk_result.get("average_score", 0),
                "threats_found": threat_result["threats_found"],
                "threats": [
                    {"name": t.get("threat", ""), "severity": t.get("severity", "Medium"), "score": t.get("score", 0)}
                    for t in risk_result.get("threats", [])
                ],
                "created_at": datetime.now(timezone.utc),
            }
            await database["threat_reports"].insert_one(threat_report_doc)
            logger.info(f"Saved threat report to MongoDB for user {user_id}, project {data.project_name}")
        except Exception as e:
            logger.warning(f"Failed to save threat report to MongoDB: {e}")

    # Save to Google Sheets (non-fatal)
    try:
        from app.services.google_sheets_service import (
            save_threats_to_sheet,
            save_risk_matrix_to_sheet,
            save_recommendations_to_sheet,
        )
        save_threats_to_sheet(
            project_id=project_id,
            project_name=data.project_name,
            threats=risk_result.get("threats", []),
        )
        save_risk_matrix_to_sheet(
            project_id=project_id,
            project_name=data.project_name,
            threats=risk_result.get("threats", []),
        )
        save_recommendations_to_sheet(
            project_id=project_id,
            project_name=data.project_name,
            recommendations=recommendations,
        )
    except Exception:
        pass

    return final_result
