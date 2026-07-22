"""
AI Dashboard Prompt Templates
All prompts instruct the model to return strict JSON so the service layer
can parse them reliably. Each prompt ends with explicit schema instructions.
"""

# ── 1. Full Security Analysis ─────────────────────────────────────────────────
SECURITY_ANALYSIS_PROMPT = """
You are a senior cybersecurity expert analysing a user's application security dashboard.

Security Data:
{data}

Analyse the data and return ONLY valid JSON (no markdown fences, no extra text):
{{
  "status": "Good | Fair | Poor | Critical",
  "summary": "2-3 sentence plain-English overview",
  "risk_score": <integer 0-100>,
  "risk_level": "Low | Medium | High | Critical",
  "main_concerns": ["concern 1", "concern 2", "concern 3"],
  "recommended_actions": ["action 1", "action 2", "action 3"],
  "learning_suggestion": {{
    "topic": "topic name",
    "reason": "why this topic fits the user's current risks"
  }}
}}
"""

# ── 2. Risk Score ─────────────────────────────────────────────────────────────
RISK_SCORE_PROMPT = """
You are a cybersecurity risk analyst.

Security metrics:
{data}

Calculate the overall risk score and return ONLY valid JSON:
{{
  "score": <integer 0-100>,
  "level": "Low | Medium | High | Critical",
  "breakdown": {{
    "vulnerability_score": <0-40>,
    "configuration_score": <0-30>,
    "activity_score": <0-30>
  }},
  "trend": "improving | stable | worsening",
  "trend_change": <integer, positive = improvement>,
  "explanation": "1-2 sentences explaining the score"
}}
"""

# ── 3. Recommendations ────────────────────────────────────────────────────────
RECOMMENDATIONS_PROMPT = """
You are a cybersecurity consultant providing actionable remediation advice.

Security context:
{data}

Return ONLY valid JSON:
{{
  "immediate": [
    {{"action": "...", "reason": "...", "effort": "Low | Medium | High", "impact": "Low | Medium | High"}}
  ],
  "short_term": [
    {{"action": "...", "reason": "...", "effort": "Low | Medium | High", "impact": "Low | Medium | High"}}
  ],
  "long_term": [
    {{"action": "...", "reason": "...", "effort": "Low | Medium | High", "impact": "Low | Medium | High"}}
  ]
}}

Each array should contain 2-3 items. Prioritise by severity of impact.
"""

# ── 4. Trend Analysis ─────────────────────────────────────────────────────────
TREND_ANALYSIS_PROMPT = """
You are a security trend analyst reviewing week-over-week vulnerability data.

Trend data:
{data}

Return ONLY valid JSON:
{{
  "overall_trend": "improving | stable | worsening",
  "summary": "1-2 sentence summary",
  "highlights": [
    {{"metric": "...", "change": "...", "direction": "up | down | stable"}}
  ],
  "forecast": "Short 1-sentence forecast for next 7 days",
  "recommendation": "One specific action based on the trend"
}}
"""

# ── 5. Learning Recommendation ────────────────────────────────────────────────
LEARNING_PROMPT = """
You are a cybersecurity educator creating personalised learning paths.

User profile:
{data}

Return ONLY valid JSON:
{{
  "primary": {{
    "topic": "...",
    "reason": "...",
    "resource": "OWASP | Quiz | Lab | Documentation",
    "estimated_time": "e.g. 30 minutes",
    "path": "/owasp | /quiz | /progress"
  }},
  "secondary": [
    {{"topic": "...", "reason": "...", "resource": "...", "path": "..."}}
  ],
  "skill_gap": "One sentence describing the main knowledge gap",
  "xp_reward": <integer 50-500>
}}
"""

# ── 6. Executive Report ───────────────────────────────────────────────────────
EXECUTIVE_REPORT_PROMPT = """
You are writing a concise executive security report for a non-technical audience.

Project data:
{data}

Return ONLY valid JSON:
{{
  "executive_summary": "2-3 sentence plain-English summary suitable for management",
  "current_risk": "Low | Medium | High | Critical",
  "score": <integer 0-100>,
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "priority_actions": [
    {{"action": "...", "owner": "Security Team | Developer | Management", "deadline": "Immediate | 1 Week | 1 Month"}}
  ],
  "compliance_status": "Compliant | Partially Compliant | Non-Compliant",
  "next_review": "Recommended next review timeframe"
}}
"""

# ── 7. Dashboard Assistant (free-form Q&A) ────────────────────────────────────
ASSISTANT_PROMPT = """
You are CyberShield AI, a friendly and expert cybersecurity assistant embedded
in a security dashboard. Keep answers concise, clear, and actionable.
Use markdown formatting. Do not generate harmful content.

Dashboard context:
{context}

User question: {question}

Answer:
"""
