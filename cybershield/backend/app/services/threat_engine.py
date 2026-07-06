
from app.data.threat_rules import THREAT_RULES
from typing import List, Dict, Any
from collections import defaultdict


def calculate_risk_level(threats: List[Dict[str, Any]]) -> str:
    """Calculate overall risk level based on threats"""
    severity_counts = defaultdict(int)
    for threat in threats:
        severity_counts[threat["severity"]] += 1
    
    if severity_counts.get("Critical", 0) > 0:
        return "Critical"
    elif severity_counts.get("High", 0) > 2:
        return "High"
    elif severity_counts.get("High", 0) > 0 or severity_counts.get("Medium", 0) > 2:
        return "Medium"
    else:
        return "Low"


def generate_threats(project: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate security threats based on project details
    """
    technologies = []
    
    # Collect all technologies from project
    if project.get("frontend"):
        technologies.append(project["frontend"])
    if project.get("backend"):
        technologies.append(project["backend"])
    if project.get("database"):
        technologies.append(project["database"])
    if project.get("authentication"):
        technologies.append(project["authentication"])
    if project.get("cloud"):
        technologies.append(project["cloud"])
    if project.get("third_party"):
        technologies.extend(project["third_party"])
    
    # Normalize technology names to match rules keys
    tech_normalized = []
    for tech in technologies:
        tech_lower = tech.lower()
        # Match common variations
        if "fastapi" in tech_lower:
            tech_normalized.append("FastAPI")
        elif "react" in tech_lower:
            tech_normalized.append("React")
        elif "jwt" in tech_lower or "json web token" in tech_lower:
            tech_normalized.append("JWT")
        elif "mongodb" in tech_lower or "mongo" in tech_lower:
            tech_normalized.append("MongoDB")
        elif "google sheets" in tech_lower or "google sheet" in tech_lower:
            tech_normalized.append("Google Sheets")
        elif "aws" in tech_lower or "amazon web" in tech_lower:
            tech_normalized.append("AWS")
        elif "github" in tech_lower:
            tech_normalized.append("GitHub API")
        else:
            # Keep as-is if no exact match
            tech_normalized.append(tech)
    
    # Apply rules to generate threats
    threats = []
    seen_threat_ids = set()
    
    for tech in tech_normalized:
        if tech in THREAT_RULES:
            for threat in THREAT_RULES[tech]:
                if threat["id"] not in seen_threat_ids:
                    threats.append(threat)
                    seen_threat_ids.add(threat["id"])
    
    # Calculate risk level and summary stats
    risk_level = calculate_risk_level(threats)
    severity_summary = defaultdict(int)
    for threat in threats:
        severity_summary[threat["severity"]] += 1
    
    return {
        "project": project["project_name"],
        "threats_found": len(threats),
        "risk_level": risk_level,
        "severity_summary": dict(severity_summary),
        "threats": threats
    }
