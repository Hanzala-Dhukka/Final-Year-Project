import json
from typing import Dict, Any, List, Optional
from app.services.error_log_service import fire_and_forget_log


async def generate_learning_recommendations(
    topic: str,
    skill_level: str,
    performance_data: Dict[str, Any],
    user_id: str = "anonymous"
) -> Dict[str, Any]:
    """
    Generate personalized learning recommendations using Gemini AI
    
    Args:
        topic: Current topic
        skill_level: User's skill level
        performance_data: Dictionary with performance metrics
        user_id: User identifier
    
    Returns:
        Dictionary with recommendations
    """
    try:
        # Build the prompt
        from app.services.prompt_builder import build_recommendation_prompt
        prompt = build_recommendation_prompt(
            topic=topic,
            skill_level=skill_level,
            performance_data=performance_data
        )
        
        # Generate AI response
        project_context = {
            "project_id": user_id,
            "topic": topic,
            "skill_level": skill_level
        }
        
        from app.services.gemini_service import generate_ai_response
        ai_response = await generate_ai_response(prompt, project_context)
        
        # Extract the answer
        answer = ai_response.get("answer", {})
        
        # If answer is a string (fallback), parse it
        if isinstance(answer, str):
            return _get_fallback_recommendations(topic, skill_level, performance_data)
        
        # Parse the JSON response from Gemini
        recommended_topics = answer.get("recommended_topics", [])
        focus_areas = answer.get("focus_areas", [])
        practice_recommendations = answer.get("practice_recommendations", [])
        reasoning = answer.get("reasoning", "")
        
        return {
            "recommended_topics": recommended_topics[:3],  # Top 3
            "focus_areas": focus_areas[:2],  # Top 2
            "practice_recommendations": practice_recommendations[:2],  # Top 2
            "reasoning": reasoning,
            "provider": ai_response.get("provider", "Unknown"),
            "model": ai_response.get("model", "Unknown")
        }
    
    except Exception as e:
        fire_and_forget_log()
        print(f"Error generating recommendations: {e}")
        return _get_fallback_recommendations(topic, skill_level, performance_data)


def _get_fallback_recommendations(
    topic: str,
    skill_level: str,
    performance_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Provide fallback recommendations when AI is unavailable"""
    
    recommendations_db = {
        "SQL Injection": {
            "Beginner": {
                "recommended_topics": ["XSS Basics", "CSRF Fundamentals", "Input Validation"],
                "focus_areas": ["SQL basics", "Authentication mechanisms"],
                "practice_recommendations": ["Practice basic SQL queries", "Try simple injection payloads"]
            },
            "Intermediate": {
                "recommended_topics": ["Blind SQL Injection", "UNION Injection", "Database Security"],
                "focus_areas": ["Parameterized queries", "Prepared statements"],
                "practice_recommendations": ["Implement parameterized queries", "Practice UNION-based injections"]
            },
            "Advanced": {
                "recommended_topics": ["NoSQL Injection", "ORM Vulnerabilities", "Advanced Database Security"],
                "focus_areas": ["Time-based injections", "Second-order SQL injection"],
                "practice_recommendations": ["Explore blind injection techniques", "Study advanced bypass methods"]
            }
        },
        "XSS": {
            "Beginner": {
                "recommended_topics": ["HTML Basics", "JavaScript Fundamentals", "DOM Structure"],
                "focus_areas": ["HTML structure", "JavaScript basics"],
                "practice_recommendations": ["Learn HTML tags", "Practice basic JavaScript"]
            },
            "Intermediate": {
                "recommended_topics": ["DOM-based XSS", "CSP", "Stored XSS"],
                "focus_areas": ["Content Security Policy", "Input sanitization"],
                "practice_recommendations": ["Implement CSP headers", "Practice DOM-based XSS"]
            },
            "Advanced": {
                "recommended_topics": ["Mutation XSS", "Polyglot Payloads", "Browser Security"],
                "focus_areas": ["XSS filter bypass", "Advanced payloads"],
                "practice_recommendations": ["Create polyglot payloads", "Study mXSS techniques"]
            }
        },
        "CSRF": {
            "Beginner": {
                "recommended_topics": ["HTTP Methods", "Cookies & Sessions", "Authentication"],
                "focus_areas": ["HTTP basics", "Session management"],
                "practice_recommendations": ["Understand GET vs POST", "Learn about cookies"]
            },
            "Intermediate": {
                "recommended_topics": ["CSRF Tokens", "SameSite Cookies", "CORS"],
                "focus_areas": ["CSRF prevention", "Token implementation"],
                "practice_recommendations": ["Implement CSRF tokens", "Configure SameSite cookies"]
            },
            "Advanced": {
                "recommended_topics": ["CSRF in APIs", "Advanced Bypass", "Framework Security"],
                "focus_areas": ["API security", "Advanced bypass techniques"],
                "practice_recommendations": ["Secure REST APIs", "Study framework-specific CSRF"]
            }
        }
    }
    
    topic_recs = recommendations_db.get(topic, {}).get(skill_level, {
        "recommended_topics": ["Web Security Fundamentals", "OWASP Top 10", "Secure Coding"],
        "focus_areas": ["General security concepts", "Best practices"],
        "practice_recommendations": ["Practice secure coding", "Study common vulnerabilities"]
    })
    
    return {
        "recommended_topics": topic_recs["recommended_topics"],
        "focus_areas": topic_recs["focus_areas"],
        "practice_recommendations": topic_recs["practice_recommendations"],
        "reasoning": f"Based on your {skill_level} level performance in {topic}, these recommendations will help you progress systematically.",
        "provider": "Fallback",
        "model": "rule-based"
    }


async def generate_follow_up_questions(
    topic: str,
    skill_level: str,
    explanation: str,
    user_id: str = "anonymous"
) -> List[str]:
    """
    Generate follow-up learning questions using Gemini AI
    
    Args:
        topic: Current topic
        skill_level: User's skill level
        explanation: The explanation just provided
        user_id: User identifier
    
    Returns:
        List of follow-up questions
    """
    try:
        from app.services.prompt_builder import build_follow_up_questions_prompt
        
        prompt = build_follow_up_questions_prompt(
            topic=topic,
            skill_level=skill_level,
            explanation=explanation
        )
        
        project_context = {
            "project_id": user_id,
            "topic": topic,
            "skill_level": skill_level
        }
        
        from app.services.gemini_service import generate_ai_response
        ai_response = await generate_ai_response(prompt, project_context)
        answer = ai_response.get("answer", {})
        
        if isinstance(answer, dict):
            follow_ups = answer.get("follow_up_questions", [])
            if follow_ups:
                return follow_ups
        
        # Fallback
        return _get_fallback_follow_up_questions(topic, skill_level)
    
    except Exception as e:
        fire_and_forget_log()
        print(f"Error generating follow-up questions: {e}")
        return _get_fallback_follow_up_questions(topic, skill_level)


def _get_fallback_follow_up_questions(topic: str, skill_level: str) -> List[str]:
    """Provide fallback follow-up questions"""
    
    follow_ups_db = {
        "SQL Injection": {
            "Beginner": [
                "Would you like to learn about XSS (Cross-Site Scripting)?",
                "Would you like to learn about CSRF (Cross-Site Request Forgery)?",
                "Would you like to learn about Input Validation?",
                "Would you like to learn about Authentication mechanisms?"
            ],
            "Intermediate": [
                "Would you like to learn about Blind SQL Injection?",
                "Would you like to learn about UNION-based SQL Injection?",
                "Would you like to learn about Database Security best practices?",
                "Would you like to learn about Parameterized Queries?"
            ],
            "Advanced": [
                "Would you like to learn about NoSQL Injection?",
                "Would you like to learn about ORM Vulnerabilities?",
                "Would you like to learn about Time-based Blind Injection?",
                "Would you like to learn about Second-order SQL Injection?"
            ]
        },
        "XSS": {
            "Beginner": [
                "Would you like to learn about SQL Injection?",
                "Would you like to learn about CSRF?",
                "Would you like to learn about HTML sanitization?",
                "Would you like to learn about JavaScript security?"
            ],
            "Intermediate": [
                "Would you like to learn about DOM-based XSS?",
                "Would you like to learn about Content Security Policy (CSP)?",
                "Would you like to learn about Stored XSS?",
                "Would you like to learn about XSS prevention techniques?"
            ],
            "Advanced": [
                "Would you like to learn about Mutation XSS (mXSS)?",
                "Would you like to learn about Polyglot Payloads?",
                "Would you like to learn about Browser security models?",
                "Would you like to learn about XSS filter bypass techniques?"
            ]
        }
    }
    
    topic_follow_ups = follow_ups_db.get(topic, {})
    return topic_follow_ups.get(skill_level, [
        "Would you like to learn about Web Security Fundamentals?",
        "Would you like to learn about OWASP Top 10?",
        "Would you like to learn about Secure Coding practices?",
        "Would you like to learn about common vulnerability patterns?"
    ])


def get_learning_path(user_id: str, current_topic: str, skill_level: str) -> List[str]:
    """
    Generate a learning path for a user
    
    Args:
        user_id: User identifier
        current_topic: Current topic being learned
        skill_level: User's skill level
    
    Returns:
        List of topics in learning path order
    """
    
    learning_paths = {
        "Beginner": [
            "Web Security Fundamentals",
            "HTTP Basics",
            "SQL Injection Basics",
            "XSS Basics",
            "CSRF Fundamentals",
            "Input Validation",
            "Authentication & Session Management",
            "Secure Coding Practices"
        ],
        "Intermediate": [
            "Advanced SQL Injection",
            "Blind SQL Injection",
            "DOM-based XSS",
            "Stored XSS",
            "CSRF Tokens",
            "CORS Configuration",
            "Security Headers",
            "OWASP Top 10 Deep Dive"
        ],
        "Advanced": [
            "NoSQL Injection",
            "ORM Vulnerabilities",
            "Mutation XSS",
            "Polyglot Payloads",
            "Advanced CSRF Bypass",
            "API Security",
            "Business Logic Flaws",
            "Advanced Penetration Testing"
        ]
    }
    
    path = learning_paths.get(skill_level, learning_paths["Beginner"])
    
    # Ensure current topic is in the path
    if current_topic not in path:
        path.insert(0, current_topic)
    
    return path


# ─────────────────────────────────────────────────────────────────────────────
# Threat-model recommendation helpers (used by services/threat_model_service.py)
# ─────────────────────────────────────────────────────────────────────────────

import re as _re


def _severity_to_priority(severity: str) -> str:
    return {
        "Critical": "P1",
        "High": "P2",
        "Medium": "P3",
        "Low": "P4",
    }.get(severity, "P3")


def _parse_json_response(raw: str) -> Any:
    """Parse AI JSON response, handling markdown fences and messy output."""
    text = raw.strip()
    fence = _re.search(r"```(?:json)?\s*\n?(.*?)```", text, _re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        fire_and_forget_log()
        pass
    brace = text.find("{")
    bracket = text.find("[")
    start = -1
    if brace != -1 and bracket != -1:
        start = min(brace, bracket)
    elif brace != -1:
        start = brace
    elif bracket != -1:
        start = bracket
    if start != -1:
        # Try object first, then array
        for opener, closer in [("{", "}"), ("[", "]")]:
            s = text.find(opener, start)
            e = text.rfind(closer)
            if s != -1 and e > s:
                try:
                    return json.loads(text[s:e + 1])
                except json.JSONDecodeError:
                    fire_and_forget_log()
                    pass
    return None


RECOMMENDATION_PROMPT = """You are a senior security architect. Given the following project and threats, generate prioritized security recommendations tailored to this specific tech stack.

PROJECT CONTEXT:
{project_context}

THREATS:
{threats_text}

Return ONLY a JSON array (no markdown). Each element:
{{
  "priority": "P1|P2|P3|P4",
  "title": "<short title>",
  "category": "<category>",
  "severity": "Critical|High|Medium|Low",
  "description": "<why this matters, 1-2 sentences>",
  "recommendation": "<specific actionable fix using the project's actual technologies>"
}}

Sort by priority (P1 first). Recommendations MUST reference the project's specific technologies. Return ONLY the JSON array."""


FIX_PLAN_PROMPT = """You are a security remediation planner. Given this project and its threats, create a structured fix plan tailored to the specific tech stack.

PROJECT CONTEXT:
{project_context}

THREATS:
{threats_text}

Return ONLY a JSON object (no markdown):
{{
  "immediate": ["<action 1>", "<action 2>", ...],
  "short_term": ["<action 1>", "<action 2>", ...],
  "long_term": ["<action 1>", "<action 2>", ...]
}}

- immediate: actions to take within 24 hours (Critical/High threats)
- short_term: actions within 1-7 days (Medium threats)
- long_term: actions within 1-4 weeks (Low/hardening)
Each action should be specific and actionable. 3-5 items per category. Return ONLY the JSON object."""


SECURITY_REPORT_PROMPT = """You are a security analyst writing an executive security report for a project.

PROJECT CONTEXT:
{project_context}

Risk Level: {risk_level}
Threats Found: {threats_found}

THREATS:
{threats_text}

SEVERITY BREAKDOWN:
{severity_text}

Return ONLY a JSON object (no markdown):
{{
  "executive_summary": "<2-3 paragraph executive summary of the security posture, specific to this project's technologies>",
  "risk_matrix": {{
    "Critical": "<description of critical risks>",
    "High": "<description of high risks>",
    "Medium": "<description of medium risks>",
    "Low": "<description of low risks>"
  }},
  "severity_breakdown": {{
    "Critical": "<analysis of critical severity threats>",
    "High": "<analysis of high severity threats>",
    "Medium": "<analysis of medium severity threats>",
    "Low": "<analysis of low severity threats>"
  }},
  "compliance_gaps": ["<gap specific to project technologies>", ...]
}}

Write professionally. Reference specific technologies from the project. 3-6 compliance gaps. Return ONLY the JSON object."""


def _threats_to_text(threats: List[Dict[str, Any]]) -> str:
    lines = []
    for t in threats or []:
        lines.append(
            f"- [{t.get('severity','Medium')}] {t.get('threat','Unknown')} "
            f"({t.get('category','General')}) — {t.get('impact','')}"
        )
    return "\n".join(lines) if lines else "No threats identified"


def _build_project_context(project: Dict[str, Any]) -> str:
    """Build a human-readable project context string for AI prompts."""
    lines = [f"Project: {project.get('project_name', 'Unknown')}"]
    if project.get("description"):
        lines.append(f"Description: {project['description']}")
    lines.append(f"Frontend: {project.get('frontend', 'N/A')}")
    lines.append(f"Backend: {project.get('backend', 'N/A')}")
    lines.append(f"Database: {project.get('database', 'N/A')}")
    lines.append(f"Authentication: {project.get('authentication', 'N/A')}")
    if project.get("cloud"):
        lines.append(f"Cloud: {project['cloud']}")
    if project.get("third_party"):
        lines.append(f"Third-Party APIs: {', '.join(project['third_party'])}")
    if project.get("assets"):
        lines.append(f"Sensitive Assets: {', '.join(project['assets'])}")
    return "\n".join(lines)


async def generate_recommendations(threats: List[Dict[str, Any]], project: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """Generate AI-powered recommendations, falling back to rule-based."""
    # Try AI
    try:
        from app.ai.gemini_client import is_available, generate
        if is_available():
            project_context = _build_project_context(project) if project else "No project context available"
            prompt = RECOMMENDATION_PROMPT.format(project_context=project_context, threats_text=_threats_to_text(threats))
            raw = await generate(prompt)
            parsed = _parse_json_response(raw)
            if isinstance(parsed, list) and len(parsed) >= 2:
                return parsed
    except Exception as e:
        fire_and_forget_log()
        print(f"[RecEngine] AI recommendations failed: {e}")

    # Fallback: rule-based
    recommendations = []
    for t in threats or []:
        recommendations.append({
            "priority": _severity_to_priority(t.get("severity", "Medium")),
            "title": t.get("threat") or t.get("name") or t.get("title", "Unnamed threat"),
            "category": t.get("category", t.get("technology", "General")),
            "severity": t.get("severity", "Medium"),
            "description": t.get("impact", ""),
            "recommendation": t.get("recommendation", "Review and remediate this threat."),
        })
    recommendations.sort(key=lambda r: r["priority"])
    return recommendations


async def generate_fix_plan(threats: List[Dict[str, Any]], project: Dict[str, Any] = None) -> Dict[str, Any]:
    """Generate AI-powered fix plan, falling back to rule-based."""
    # Try AI
    try:
        from app.ai.gemini_client import is_available, generate
        if is_available():
            project_context = _build_project_context(project) if project else "No project context available"
            prompt = FIX_PLAN_PROMPT.format(project_context=project_context, threats_text=_threats_to_text(threats))
            raw = await generate(prompt)
            parsed = _parse_json_response(raw)
            if isinstance(parsed, dict) and any(parsed.get(k) for k in ("immediate", "short_term", "long_term")):
                return parsed
    except Exception as e:
        fire_and_forget_log()
        print(f"[RecEngine] AI fix plan failed: {e}")

    # Fallback: rule-based
    plan = {"immediate": [], "short_term": [], "long_term": []}
    for t in threats or []:
        item = {
            "id": t.get("id"),
            "threat": t.get("threat") or t.get("name", "Unnamed threat"),
            "severity": t.get("severity", "Medium"),
            "action": t.get("recommendation", "Review and remediate this threat."),
        }
        sev = t.get("severity", "Medium")
        if sev in ("Critical", "High"):
            plan["immediate"].append(item)
        elif sev == "Medium":
            plan["short_term"].append(item)
        else:
            plan["long_term"].append(item)
    return plan


async def generate_security_report(
    project_name: str,
    threats: List[Dict[str, Any]],
    risk_summary: Dict[str, Any],
    risk_level: str = "Medium",
    project: Dict[str, Any] = None,
) -> Dict[str, Any]:
    """Generate AI-powered security report, falling back to rule-based."""
    # Try AI
    try:
        from app.ai.gemini_client import is_available, generate
        if is_available():
            threats_text = _threats_to_text(threats)
            severity_text = "\n".join(
                f"- {k}: {v}" for k, v in (risk_summary or {}).items()
            ) or "No data"
            project_context = _build_project_context(project) if project else f"Project: {project_name}"
            prompt = SECURITY_REPORT_PROMPT.format(
                project_context=project_context,
                risk_level=risk_level,
                threats_found=len(threats or []),
                threats_text=threats_text,
                severity_text=severity_text,
            )
            raw = await generate(prompt)
            parsed = _parse_json_response(raw)
            if isinstance(parsed, dict) and "executive_summary" in parsed:
                return parsed
    except Exception as e:
        fire_and_forget_log()
        print(f"[RecEngine] AI security report failed: {e}")

    # Fallback: rule-based
    severity_counts = risk_summary or {}
    report_lines = [
        f"Security Report for: {project_name}",
        "",
        "Severity Summary:",
    ]
    if severity_counts:
        for sev, count in severity_counts.items():
            report_lines.append(f"  - {sev}: {count}")
    else:
        report_lines.append("  - No severity data available")

    report_lines.append("")
    report_lines.append("Identified Threats:")
    for t in threats or []:
        report_lines.append(
            f"  [{t.get('severity', 'Medium')}] {t.get('threat') or t.get('name', 'Unnamed')} "
            f"({t.get('category', t.get('technology', 'General'))})"
        )
        if t.get("recommendation"):
            report_lines.append(f"      Fix: {t.get('recommendation')}")

    report_text = "\n".join(report_lines)
    return {
        "executive_summary": report_text,
        "risk_matrix": {
            sev: f"{count} threats identified" for sev, count in severity_counts.items()
        } if severity_counts else {"Info": "No severity data available"},
        "severity_breakdown": {
            sev: f"{count} threats at this severity level" for sev, count in severity_counts.items()
        } if severity_counts else {"Info": "No data"},
        "compliance_gaps": [
            "Review authentication mechanisms",
            "Validate input sanitization across all endpoints",
            "Ensure HTTPS is enforced in production",
        ],
        "project_name": project_name,
        "severity_summary": severity_counts,
        "threat_count": len(threats or []),
    }