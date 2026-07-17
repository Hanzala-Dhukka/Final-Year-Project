"""
Language detection for the AI Code Review module (Module 5.3).

Maps file extensions and simple heuristics to a canonical language name used
by the rest of the review pipeline.
"""
from typing import Optional

# Extension -> canonical language name
_EXTENSION_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".java": "Java",
    ".php": "PHP",
    ".go": "Go",
    ".cs": "C#",
    ".cpp": "C++",
    ".cc": "C++",
    ".cxx": "C++",
    ".c": "C",
    ".h": "C",
    ".hpp": "C++",
    ".html": "HTML",
    ".htm": "HTML",
    ".css": "CSS",
    ".sql": "SQL",
    ".sh": "Shell",
    ".bash": "Shell",
    ".rb": "Ruby",
    ".rs": "Rust",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".json": "JSON",
    ".xml": "XML",
    ".yml": "YAML",
    ".yaml": "YAML",
}

# Canonical names we explicitly support for analysis
SUPPORTED_LANGUAGES = [
    "Python", "JavaScript", "TypeScript", "Java", "PHP", "Go",
    "C#", "C++", "C", "HTML", "CSS", "SQL", "Shell",
]

# Accepted upload extensions
ALLOWED_EXTENSIONS = [
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".php", ".go",
    ".cs", ".cpp", ".cc", ".cxx", ".c", ".h", ".hpp",
    ".html", ".htm", ".css", ".sql", ".sh", ".bash",
]


def detect_by_filename(filename: str) -> Optional[str]:
    """Return a canonical language name from a filename, or None."""
    if not filename:
        return None
    lower = filename.lower()
    for ext, lang in _EXTENSION_MAP.items():
        if lower.endswith(ext):
            return lang
    return None


def detect_by_hint(hint: Optional[str]) -> Optional[str]:
    """Normalise an explicit language hint (e.g. 'python' -> 'Python')."""
    if not hint:
        return None
    normalized = hint.strip().lower()
    for lang in SUPPORTED_LANGUAGES:
        if lang.lower() == normalized:
            return lang
    # Common aliases
    aliases = {
        "py": "Python",
        "javascript": "JavaScript",
        "typescript": "TypeScript",
        "csharp": "C#",
        "cpp": "C++",
        "shell": "Shell",
        "bash": "Shell",
    }
    return aliases.get(normalized)


def is_allowed_extension(filename: str) -> bool:
    """Whether the filename has an accepted upload extension."""
    if not filename:
        return False
    return filename.lower().endswith(tuple(ALLOWED_EXTENSIONS))


def resolve_language(filename: Optional[str], hint: Optional[str]) -> str:
    """
    Resolve the language to use. Priority: explicit hint > filename extension.

    Returns:
        A canonical language name (defaults to "Python" when unknown).
    """
    lang = detect_by_hint(hint) or detect_by_filename(filename)
    return lang or "Python"
