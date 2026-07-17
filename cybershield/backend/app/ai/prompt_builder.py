"""
Prompt construction for the AI Security Assistant.

Builds the CyberShield system prompt plus a conversation history section so the
model can answer follow-up questions in context (foundation for later modules).
"""

SYSTEM_PROMPT = """You are CyberShield AI.

You are a cybersecurity instructor.

Rules:
- Explain clearly.
- Use simple language.
- Provide examples.
- Use markdown.
- Return code blocks when needed.
- Avoid unsafe hacking instructions.
- Recommend secure coding practices.
"""


def build_user_prompt(message: str, history: list = None) -> str:
    """
    Build the full prompt sent to Gemini.

    Args:
        message: The latest user message.
        history: Optional list of prior {"role", "content"} messages.

    Returns:
        A single prompt string combining the system prompt, history and message.
    """
    parts = [SYSTEM_PROMPT.strip()]

    if history:
        parts.append("\n---\nConversation history:")
        for item in history:
            role = "User" if item.get("role") == "user" else "CyberShield AI"
            parts.append(f"{role}: {item.get('content', '')}")

    parts.append("\n---\nUser: " + message.strip())
    parts.append("\nCyberShield AI:")
    return "\n".join(parts)


CONTEXT_LABELS = {
    "general": "General Security",
    "github_scan": "GitHub Scanner",
    "threat_report": "Threat Report",
    "owasp": "OWASP Simulator",
    "quiz": "Quiz",
    "glossary": "Glossary",
}


def _fmt(value) -> str:
    """Render a python value as compact, prompt-friendly text."""
    if value is None:
        return "Not available"
    if isinstance(value, (dict, list)):
        try:
            import json
            return json.dumps(value, indent=2, default=str)
        except Exception:
            return str(value)
    return str(value)


def build_context_prompt(
    message: str,
    context: dict,
    context_type: str = "general",
    history: list = None,
) -> str:
    """
    Build a structured, context-aware prompt for Gemini (Module 5.2).

    Layout:
      SYSTEM: CyberShield AI instruction
      CURRENT PROJECT: project name + tech stack
      CURRENT CONTEXT: which data domain is active
      LATEST DATA: the user's actual CyberShield data for that domain
      CONVERSATION HISTORY: prior messages (for memory)
      USER QUESTION: the latest message
      INSTRUCTIONS: how to answer

    Args:
        message: Latest user question.
        context: Output of context_service.build_context().
        context_type: One of general/github_scan/threat_report/owasp/quiz/glossary.
        history: Optional list of {"role", "content"} prior messages.

    Returns:
        A single prompt string.
    """
    label = CONTEXT_LABELS.get(context_type, "General Security")

    parts = [SYSTEM_PROMPT.strip()]

    # Project
    project = context.get("project") or {}
    parts.append("\n---\nCURRENT PROJECT:")
    if project.get("name"):
        parts.append(f"Name: {project.get('name')}")
        if project.get("tech_stack"):
            parts.append(f"Tech Stack: {', '.join(project.get('tech_stack'))}")
        if project.get("description"):
            parts.append(f"Description: {project.get('description')}")
    else:
        parts.append("No active project selected.")

    # Active context domain
    parts.append(f"\n---\nCURRENT CONTEXT: {label}")

    # Latest data (domain-specific slice)
    parts.append("\nLATEST DATA:")
    if context_type == "github_scan":
        parts.append("GitHub Scan:\n" + _fmt(context.get("latest_scan")))
    elif context_type == "threat_report":
        parts.append("Threat Report:\n" + _fmt(context.get("latest_threat_report")))
    elif context_type == "owasp":
        parts.append("OWASP Simulator:\n" + _fmt(context.get("latest_owasp")))
    elif context_type == "quiz":
        parts.append("Quiz:\n" + _fmt(context.get("latest_quiz")))
    else:
        # general / glossary: provide a broad view
        parts.append("GitHub Scan:\n" + _fmt(context.get("latest_scan")))
        parts.append("Threat Report:\n" + _fmt(context.get("latest_threat_report")))
        parts.append("OWASP Simulator:\n" + _fmt(context.get("latest_owasp")))
        parts.append("Quiz:\n" + _fmt(context.get("latest_quiz")))
        parts.append("Learning Progress:\n" + _fmt(context.get("learning_progress")))

    # Conversation memory
    if history:
        parts.append("\n---\nCONVERSATION HISTORY:")
        for item in history:
            role = "User" if item.get("role") == "user" else "CyberShield AI"
            parts.append(f"{role}: {item.get('content', '')}")

    # The question
    parts.append("\n---\nUSER QUESTION:\n" + message.strip())

    # Answering instructions
    parts.append(
        "\n---\nINSTRUCTIONS:\n"
        "- Answer based on the provided project data.\n"
        "- If information is missing, clearly state it.\n"
        "- Give practical remediation steps.\n"
        "- Use Markdown formatting.\n"
        "- Return code blocks when needed.\n"
        "- Recommend secure coding practices."
    )

    return "\n".join(parts)


def build_title_prompt(message: str) -> str:
    """
    Build a prompt that asks Gemini for a short conversation title.

    Args:
        message: The first user message of the conversation.

    Returns:
        A prompt string requesting a <=40 char title.
    """
    return (
        "Summarise the following user question into a short chat title. "
        "Rules: maximum 40 characters, no quotes, no punctuation at the end, "
        "plain text only.\n\n"
        f"Question: {message.strip()}\n\nTitle:"
    )
