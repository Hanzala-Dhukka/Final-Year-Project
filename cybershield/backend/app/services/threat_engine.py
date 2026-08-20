
import json
import re
from typing import List, Dict, Any
from collections import defaultdict

from app.services.error_log_service import fire_and_forget_log


# ── AI-powered threat generation ──────────────────────────────────────────────

THREAT_PROMPT_TEMPLATE = """You are a senior cybersecurity architect performing threat modeling.

Analyze the following project and generate a comprehensive list of security threats.

PROJECT DETAILS:
- Name: {project_name}
- Description: {description}
- Frontend: {frontend}
- Backend: {backend}
- Database: {database}
- Authentication: {authentication}
{cloud_line}
{third_party_line}
{assets_line}

Generate 8-15 realistic, specific security threats for this EXACT tech stack.
Do NOT generate generic threats. Focus on vulnerabilities specific to the technologies listed.

Return ONLY a JSON array (no markdown, no explanation). Each element must be:
{{
  "id": "TM001",
  "technology": "<which tech this applies to>",
  "threat": "<short threat name>",
  "category": "<API Security|Application|Authentication|Authorization|Data Protection|Network|Configuration|Cloud|Supply Chain>",
  "severity": "<Critical|High|Medium|Low>",
  "likelihood": <1-5, where 1=Rare, 2=Unlikely, 3=Possible, 4=Likely, 5=Almost Certain>,
  "impact_score": <1-5, where 1=Negligible, 2=Minor, 3=Moderate, 4=Major, 5=Catastrophic>,
  "impact": "<1-2 sentence impact description>",
  "recommendation": "<specific actionable fix>"
}}

IDs should be sequential: TM001, TM002, ...
Be specific to the actual technologies (e.g. "React XSS via dangerouslySetInnerHTML" not just "XSS").
Severity must be realistic — not everything is Critical.
Likelihood and impact_score MUST be realistic numbers based on the specific threat context.
Return ONLY the JSON array, nothing else."""


def _build_prompt(project: Dict[str, Any]) -> str:
    cloud_line = f"- Cloud: {project.get('cloud', 'N/A')}" if project.get("cloud") else ""
    third_party = project.get("third_party", [])
    third_party_line = f"- Third-Party APIs: {', '.join(third_party)}" if third_party else ""
    assets = project.get("assets", [])
    assets_line = f"- Sensitive Assets: {', '.join(assets)}" if assets else ""

    return THREAT_PROMPT_TEMPLATE.format(
        project_name=project.get("project_name", "Unknown"),
        description=project.get("description", "No description"),
        frontend=project.get("frontend", "N/A"),
        backend=project.get("backend", "N/A"),
        database=project.get("database", "N/A"),
        authentication=project.get("authentication", "N/A"),
        cloud_line=cloud_line,
        third_party_line=third_party_line,
        assets_line=assets_line,
    )


def _parse_ai_threats(raw: str) -> List[Dict[str, Any]]:
    """Parse AI JSON response into threat list, handling markdown fences etc."""
    text = raw.strip()

    # Strip markdown code fences
    fence_match = re.search(r"```(?:json)?\s*\n?(.*?)```", text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()

    # Try direct parse
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
        if isinstance(parsed, dict) and "threats" in parsed:
            return parsed["threats"]
    except json.JSONDecodeError:
        fire_and_forget_log()
        pass

    # Try extracting JSON array from surrounding text
    bracket_start = text.find("[")
    bracket_end = text.rfind("]")
    if bracket_start != -1 and bracket_end > bracket_start:
        try:
            parsed = json.loads(text[bracket_start:bracket_end + 1])
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            fire_and_forget_log()
            pass

    # Last resort: fix common JSON issues
    cleaned = text.replace("\n", " ").replace("\t", " ")
    cleaned = re.sub(r',\s*}', '}', cleaned)
    cleaned = re.sub(r',\s*]', ']', cleaned)

    bracket_start = cleaned.find("[")
    bracket_end = cleaned.rfind("]")
    if bracket_start != -1 and bracket_end > bracket_start:
        try:
            parsed = json.loads(cleaned[bracket_start:bracket_end + 1])
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            fire_and_forget_log()
            pass

    return []


def _validate_threat(t: Dict[str, Any], idx: int) -> Dict[str, Any]:
    """Ensure a threat object has all required fields with defaults."""
    # Clamp likelihood and impact_score to 1-5 range
    likelihood = t.get("likelihood")
    if likelihood is not None:
        likelihood = max(1, min(5, int(likelihood)))
    impact_score = t.get("impact_score")
    if impact_score is not None:
        impact_score = max(1, min(5, int(impact_score)))

    return {
        "id": t.get("id", f"TM{idx + 1:03d}"),
        "technology": t.get("technology", "General"),
        "threat": t.get("threat", "Unknown Threat"),
        "category": t.get("category", "Application"),
        "severity": t.get("severity", "Medium"),
        "likelihood": likelihood,
        "impact_score": impact_score,
        "impact": t.get("impact", "Potential security risk"),
        "recommendation": t.get("recommendation", "Review and remediate"),
    }


# ── Rule-based fallback (original logic) ─────────────────────────────────────

def _rule_based_threats(project: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Fallback: generate threats from static THREAT_RULES database."""
    from app.data.threat_rules import THREAT_RULES

    technologies = []
    for key in ("frontend", "backend", "database", "authentication", "cloud"):
        if project.get(key):
            technologies.append(project[key])
    if project.get("third_party"):
        technologies.extend(project["third_party"])

    # Normalize
    tech_normalized = []
    for tech in technologies:
        tl = tech.lower()
        if "fastapi" in tl:
            tech_normalized.append("FastAPI")
        elif "react" in tl:
            tech_normalized.append("React")
        elif "jwt" in tl or "json web token" in tl:
            tech_normalized.append("JWT")
        elif "mongodb" in tl or "mongo" in tl:
            tech_normalized.append("MongoDB")
        elif "google sheets" in tl:
            tech_normalized.append("Google Sheets")
        elif "aws" in tl or "amazon web" in tl:
            tech_normalized.append("AWS")
        elif "github" in tl:
            tech_normalized.append("GitHub API")
        else:
            tech_normalized.append(tech)

    threats = []
    seen = set()
    for tech in tech_normalized:
        if tech in THREAT_RULES:
            for threat in THREAT_RULES[tech]:
                if threat["id"] not in seen:
                    threats.append(threat)
                    seen.add(threat["id"])
    return threats


# ── Main entry point ──────────────────────────────────────────────────────────

async def generate_threats(project: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate security threats for a project.

    Uses Groq AI when available, falls back to rule-based matching.
    """
    threats = []
    used_ai = False

    # Try AI first
    try:
        from app.ai.gemini_client import is_available, generate
        if is_available():
            prompt = _build_prompt(project)
            raw = await generate(prompt)
            ai_threats = _parse_ai_threats(raw)
            if ai_threats and len(ai_threats) >= 3:
                threats = [_validate_threat(t, i) for i, t in enumerate(ai_threats)]
                used_ai = True
                print(f"[ThreatEngine] AI generated {len(threats)} threats")
            else:
                print(f"[ThreatEngine] AI returned too few threats ({len(ai_threats)}), using rules")
    except Exception as e:
        fire_and_forget_log()
        print(f"[ThreatEngine] AI generation failed: {e}, using rules")

    # Fallback to rules
    if not used_ai:
        threats = _rule_based_threats(project)
        print(f"[ThreatEngine] Rule-based: {len(threats)} threats")

    # Calculate risk level
    severity_counts = defaultdict(int)
    for t in threats:
        severity_counts[t.get("severity", "Medium")] += 1

    if severity_counts.get("Critical", 0) > 0:
        risk_level = "Critical"
    elif severity_counts.get("High", 0) > 2:
        risk_level = "High"
    elif severity_counts.get("High", 0) > 0 or severity_counts.get("Medium", 0) > 2:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return {
        "project": project.get("project_name", "Unknown"),
        "threats_found": len(threats),
        "risk_level": risk_level,
        "severity_summary": dict(severity_counts),
        "threats": threats,
        "used_ai": used_ai,
    }
