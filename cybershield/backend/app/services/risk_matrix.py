from typing import List, Dict, Any
from collections import defaultdict

# Likelihood scale: 1-5
# 1 = Rare, 2 = Unlikely, 3 = Possible, 4 = Likely, 5 = Almost Certain

# Impact scale: 1-5
# 1 = Negligible, 2 = Minor, 3 = Moderate, 4 = Major, 5 = Catastrophic

# Likelihood mappings for each threat
LIKELIHOOD_MAPPING = {
    # FastAPI threats
    "Missing Rate Limiting": 3,
    "Missing Input Validation": 4,
    "Missing HTTPS": 4,
    "Missing Authentication": 5,
    "Missing Authorization": 4,
    "Missing CORS Configuration": 2,
    
    # React threats
    "Cross-Site Scripting (XSS)": 3,
    "DOM Injection": 3,
    "Sensitive Data Exposure": 4,
    "Unsafe Local Storage": 3,
    "Missing Content Security Policy": 3,
    
    # JWT threats
    "No Token Expiration": 4,
    "Weak JWT Secret": 4,
    "Token Replay": 3,
    "Missing Refresh Token": 2,
    "Token Theft": 4,
    
    # MongoDB threats
    "No Authentication": 5,
    "Open Database Port": 5,
    "No Encryption": 4,
    "Weak Password": 3,
    "Backup Missing": 2,
    
    # Google Sheets threats
    "Public Spreadsheet": 5,
    "Exposed Credentials": 4,
    "Improper Sharing": 3,
    "No Backup": 2,
    "Unauthorized Access": 3,
    
    # AWS threats
    "Public S3 Bucket": 5,
    "IAM Misconfiguration": 4,
    "Exposed Access Keys": 4,
    "Security Group Too Open": 4,
    "Missing CloudTrail": 2,
    
    # GitHub API threats
    "API Rate Limit": 2,
    "Leaked Token": 4,
    "Excessive Permissions": 3,
}

# Impact mappings for each threat
IMPACT_MAPPING = {
    # FastAPI threats
    "Missing Rate Limiting": 3,
    "Missing Input Validation": 5,
    "Missing HTTPS": 5,
    "Missing Authentication": 5,
    "Missing Authorization": 4,
    "Missing CORS Configuration": 2,
    
    # React threats
    "Cross-Site Scripting (XSS)": 4,
    "DOM Injection": 3,
    "Sensitive Data Exposure": 4,
    "Unsafe Local Storage": 4,
    "Missing Content Security Policy": 3,
    
    # JWT threats
    "No Token Expiration": 5,
    "Weak JWT Secret": 5,
    "Token Replay": 3,
    "Missing Refresh Token": 2,
    "Token Theft": 5,
    
    # MongoDB threats
    "No Authentication": 5,
    "Open Database Port": 5,
    "No Encryption": 4,
    "Weak Password": 3,
    "Backup Missing": 2,
    
    # Google Sheets threats
    "Public Spreadsheet": 5,
    "Exposed Credentials": 5,
    "Improper Sharing": 4,
    "No Backup": 2,
    "Unauthorized Access": 4,
    
    # AWS threats
    "Public S3 Bucket": 5,
    "IAM Misconfiguration": 5,
    "Exposed Access Keys": 5,
    "Security Group Too Open": 4,
    "Missing CloudTrail": 2,
    
    # GitHub API threats
    "API Rate Limit": 2,
    "Leaked Token": 5,
    "Excessive Permissions": 4,
}


def calculate_risk_score(likelihood: int, impact: int) -> int:
    """Calculate risk score = likelihood × impact"""
    return likelihood * impact


def get_risk_level_from_score(score: int) -> str:
    """Convert risk score to risk level"""
    if 1 <= score <= 5:
        return "Low"
    elif 6 <= score <= 10:
        return "Medium"
    elif 11 <= score <= 15:
        return "High"
    else:  # 16-25
        return "Critical"


def get_priority_from_risk_level(risk_level: str) -> str:
    """Convert risk level to priority"""
    priority_map = {
        "Critical": "P1",
        "High": "P2",
        "Medium": "P3",
        "Low": "P4"
    }
    return priority_map.get(risk_level, "P4")


def get_likelihood_label(score: int) -> str:
    """Get likelihood label from score"""
    labels = {
        1: "Rare",
        2: "Unlikely",
        3: "Possible",
        4: "Likely",
        5: "Almost Certain"
    }
    return labels.get(score, "Unknown")


def get_impact_label(score: int) -> str:
    """Get impact label from score"""
    labels = {
        1: "Negligible",
        2: "Minor",
        3: "Moderate",
        4: "Major",
        5: "Catastrophic"
    }
    return labels.get(score, "Unknown")


def generate_risk_matrix(threats: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generate risk matrix for threats with likelihood, impact, and priority
    
    Args:
        threats: List of threat dictionaries
        
    Returns:
        List of threats with risk matrix data added
    """
    risk_threats = []
    
    for threat in threats:
        threat_name = threat.get("threat", "")
        
        # Get likelihood and impact from mappings
        likelihood = LIKELIHOOD_MAPPING.get(threat_name, 3)  # Default to 3 if not found
        impact = IMPACT_MAPPING.get(threat_name, 3)  # Default to 3 if not found
        
        # Calculate risk score
        risk_score = calculate_risk_score(likelihood, impact)
        
        # Get risk level and priority
        risk_level = get_risk_level_from_score(risk_score)
        priority = get_priority_from_risk_level(risk_level)
        
        # Create risk matrix coordinates
        coordinates = {
            "x": likelihood,
            "y": impact
        }
        
        # Create enhanced threat object
        risk_threat = {
            **threat,
            "likelihood": likelihood,
            "impact_score": impact,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "priority": priority,
            "coordinates": coordinates,
            "likelihood_label": get_likelihood_label(likelihood),
            "impact_label": get_impact_label(impact)
        }
        
        risk_threats.append(risk_threat)
    
    return risk_threats


def calculate_risk_summary(threats: List[Dict[str, Any]]) -> Dict[str, int]:
    """Calculate summary of risk levels"""
    summary = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0
    }
    
    for threat in threats:
        risk_level = threat.get("risk_level", "Low").lower()
        if risk_level in summary:
            summary[risk_level] += 1
    
    return summary


def calculate_overall_risk(threats: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate overall project risk"""
    if not threats:
        return {
            "overall_risk": "Low",
            "average_score": 0
        }
    
    total_score = sum(t.get("risk_score", 0) for t in threats)
    average_score = round(total_score / len(threats), 2)
    
    overall_risk = get_risk_level_from_score(int(average_score))
    
    return {
        "overall_risk": overall_risk,
        "average_score": int(average_score)
    }


def get_top_risks(threats: List[Dict[str, Any]], top_n: int = 5) -> List[Dict[str, Any]]:
    """Get top N highest risk threats"""
    sorted_threats = sorted(threats, key=lambda x: x.get("risk_score", 0), reverse=True)
    return [
        {
            "threat": t.get("threat", ""),
            "score": t.get("risk_score", 0)
        }
        for t in sorted_threats[:top_n]
    ]


def process_threats_with_risk_matrix(threats: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Process threats and generate complete risk matrix analysis
    
    Args:
        threats: List of threat dictionaries
        
    Returns:
        Complete risk matrix analysis with summary
    """
    # Generate risk matrix for each threat
    risk_threats = generate_risk_matrix(threats)
    
    # Calculate overall risk
    overall = calculate_overall_risk(risk_threats)
    
    # Calculate summary
    summary = calculate_risk_summary(risk_threats)
    
    # Get top risks
    top_risks = get_top_risks(risk_threats)
    
    return {
        "threats": risk_threats,
        "overall_risk": overall["overall_risk"],
        "average_score": overall["average_score"],
        "risk_summary": summary,
        "top_risks": top_risks
    }