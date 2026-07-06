from typing import Dict, Any


def build_prompt(question: str, project_context: Dict[str, Any]) -> str:
    """
    Build a comprehensive prompt for Gemini AI with project context
    
    Args:
        question: User's question
        project_context: Project context including threats, risk, recommendations
        
    Returns:
        Formatted prompt string
    """
    # Extract project details
    project_name = project_context.get("project", "Unknown Project")
    threats_found = project_context.get("threats_found", 0)
    overall_risk = project_context.get("overall_risk", "Unknown")
    average_score = project_context.get("average_score", 0)
    risk_summary = project_context.get("risk_summary", {})
    
    # Extract technology stack
    frontend = project_context.get("frontend", "Not specified")
    backend = project_context.get("backend", "Not specified")
    database = project_context.get("database", "Not specified")
    authentication = project_context.get("authentication", "Not specified")
    cloud = project_context.get("cloud", "Not specified")
    
    # Extract threats
    threats = project_context.get("threats", [])
    threat_list = []
    for threat in threats[:10]:  # Top 10 threats
        threat_name = threat.get("threat", "Unknown")
        severity = threat.get("severity", "Unknown")
        risk_score = threat.get("risk_score", 0)
        threat_list.append(f"- {threat_name} (Severity: {severity}, Score: {risk_score})")
    
    # Extract recommendations
    recommendations = project_context.get("recommendations", [])
    rec_list = []
    for rec in recommendations[:5]:  # Top 5 recommendations
        rec_list.append(f"- {rec.get('threat', 'Unknown')}: {rec.get('recommendation', 'No recommendation')}")
    
    # Build the comprehensive prompt
    prompt = f"""You are an expert Cyber Security Consultant specializing in application security, cloud security, and secure coding practices.

PROJECT CONTEXT:
===============
Project Name: {project_name}

Technology Stack:
- Frontend: {frontend}
- Backend: {backend}
- Database: {database}
- Authentication: {authentication}
- Cloud Provider: {cloud}

Security Analysis Results:
- Total Threats Found: {threats_found}
- Overall Risk Level: {overall_risk}
- Average Risk Score: {average_score}/25

Risk Summary:
- Critical: {risk_summary.get('critical', 0)} threats
- High: {risk_summary.get('high', 0)} threats
- Medium: {risk_summary.get('medium', 0)} threats
- Low: {risk_summary.get('low', 0)} threats

Top Threats:
{chr(10).join(threat_list) if threat_list else "No specific threats identified"}

Top Recommendations:
{chr(10).join(rec_list) if rec_list else "No recommendations available"}

USER QUESTION:
=============
{question}

INSTRUCTIONS:
=============
Provide a comprehensive, professional security consultation response. Answer the user's question based on the project context above.

Format your response as valid JSON with the following structure:
{{
  "title": "Brief title for the response",
  "summary": "Clear explanation addressing the user's question (2-3 paragraphs)",
  "business_impact": "Explain the business risk and potential consequences if not addressed",
  "recommendation": "Specific actionable recommendation to fix/address the issue",
  "implementation_steps": [
    "Step 1: Detailed action item",
    "Step 2: Detailed action item",
    "Step 3: Detailed action item"
  ],
  "secure_code": "Provide secure code example if applicable, otherwise leave empty string"
}}

IMPORTANT RULES:
1. Always respond with valid JSON only, no additional text
2. Be specific to the user's technology stack
3. Provide practical, actionable advice
4. Include code examples when relevant
5. Keep implementation steps clear and numbered
6. If the question is about a specific threat in their project, reference it directly
7. Use professional security terminology but explain complex concepts
8. Prioritize recommendations based on their risk level

Respond now with valid JSON:
"""

    return prompt