"""
Utility functions for GitHub repository analysis.
"""
import re

from app.services.error_log_service import fire_and_forget_log


def extract_repo_name(repo_url: str) -> str:
    """Extract owner/repo from a GitHub URL or owner/repo string."""
    url_or_path = repo_url.strip().rstrip("/")
    if url_or_path.endswith(".git"):
        url_or_path = url_or_path[:-4]

    patterns = [
        r"^https?://(?:www\.)?github\.com/([^/]+)/([^/]+)$",
        r"^git@github\.com:([^/]+)/([^/]+)$",
        r"^(?:www\.)?github\.com/([^/]+)/([^/]+)$",
        r"^([^/]+)/([^/]+)$",
    ]

    for pattern in patterns:
        match = re.match(pattern, url_or_path, re.IGNORECASE)
        if match:
            owner, repo = match.groups()
            valid_char = re.compile(r"^[a-zA-Z0-9\-_\.]+$")
            if valid_char.match(owner) and valid_char.match(repo):
                return f"{owner}/{repo}"

    raise ValueError("Invalid GitHub repository URL or format. Expected: owner/repo or full GitHub URL.")


def bytes_to_percentage(languages: dict) -> dict:
    """Convert language byte counts to percentages."""
    if not languages:
        return {}
    # Defensive: ensure all values are numeric
    clean = {}
    for lang, val in languages.items():
        try:
            n = int(val)
            if n > 0:
                clean[lang] = n
        except (TypeError, ValueError):
            fire_and_forget_log()
            continue
    total = sum(clean.values())
    if total == 0:
        return {}
    return {lang: round((bytes_count / total) * 100, 1) for lang, bytes_count in clean.items()}


def classify_file(file_path: str) -> str:
    """Classify a file by its extension for categorization."""
    ext_map = {
        ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript",
        ".jsx": "React", ".tsx": "React TS", ".java": "Java",
        ".go": "Go", ".rs": "Rust", ".rb": "Ruby", ".php": "PHP",
        ".c": "C", ".cpp": "C++", ".h": "C Header",
        ".cs": "C#", ".swift": "Swift", ".kt": "Kotlin",
        ".html": "HTML", ".css": "CSS", ".scss": "SCSS",
        ".json": "JSON", ".yml": "YAML", ".yaml": "YAML",
        ".xml": "XML", ".md": "Markdown", ".txt": "Text",
        ".sh": "Shell", ".bash": "Shell", ".bat": "Batch",
        ".sql": "SQL", ".dockerfile": "Docker",
    }
    for ext, category in ext_map.items():
        if file_path.lower().endswith(ext):
            return category
    if "dockerfile" in file_path.lower():
        return "Docker"
    if "makefile" in file_path.lower():
        return "Make"
    return "Other"


# Dependency file patterns used by the analyzer
DEPENDENCY_FILES = [
    "requirements.txt", "Pipfile", "Pipfile.lock", "pyproject.toml", "setup.py", "setup.cfg",
    "package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "pom.xml", "build.gradle", "build.gradle.kts",
    "composer.json", "composer.lock",
    "Gemfile", "Gemfile.lock",
    "Cargo.toml", "Cargo.lock",
    "go.mod", "go.sum",
    "pubspec.yaml", "pubspec.lock",
    "Podfile", "Podfile.lock",
    "Package.swift",
    "CMakeLists.txt",
    "mix.exs",
]
