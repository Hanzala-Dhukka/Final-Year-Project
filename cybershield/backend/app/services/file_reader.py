"""
File Reader Service
Fetches file content from GitHub raw URLs and returns line-by-line content
with vulnerability highlights for the VS Code-style code viewer.
"""
from pathlib import Path
import requests
from typing import List, Dict, Any, Optional
from app.services.error_log_service import fire_and_forget_log


# Monaco-editor compatible language IDs
EXTENSIONS = {
    ".js": "javascript",
    ".jsx": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".py": "python",
    ".pyw": "python",
    ".java": "java",
    ".go": "go",
    ".rs": "rust",
    ".rb": "ruby",
    ".php": "php",
    ".cs": "csharp",
    ".cpp": "cpp",
    ".c": "c",
    ".h": "c",
    ".json": "json",
    ".yml": "yaml",
    ".yaml": "yaml",
    ".xml": "xml",
    ".html": "html",
    ".htm": "html",
    ".css": "css",
    ".scss": "scss",
    ".less": "less",
    ".sh": "shell",
    ".bash": "shell",
    ".dockerfile": "dockerfile",
    ".md": "markdown",
    ".sql": "sql",
    ".env": "plaintext",
    ".txt": "plaintext",
    ".toml": "ini",
    ".ini": "ini",
    ".cfg": "ini",
}


def detect_language(file_path: str) -> str:
    """
    Return Monaco-compatible language ID from file extension.
    Falls back to 'plaintext' for unknown extensions.
    """
    suffix = Path(file_path).suffix.lower()
    return EXTENSIONS.get(suffix, "plaintext")


def fetch_file_content(
    repo_name: str,
    branch: str,
    file_path: str,
) -> Optional[List[str]]:
    """
    Fetch raw file content from GitHub.

    Args:
        repo_name:  e.g. "OWASP/NodeGoat"
        branch:     e.g. "master"
        file_path:  e.g. "app/routes/contributions.js"

    Returns:
        List of lines (strings) or None if fetch fails.
    """
    raw_url = f"https://raw.githubusercontent.com/{repo_name}/{branch}/{file_path}"
    try:
        resp = requests.get(raw_url, timeout=15)
        if resp.status_code != 200:
            return None
        # Skip binary / oversized files
        if len(resp.content) > 2_000_000:
            return None
        return resp.text.splitlines()
    except Exception:
        fire_and_forget_log()
        return None


def build_highlights(
    file_report: List[Dict[str, Any]],
    file_path: str,
) -> List[Dict[str, Any]]:
    """
    Extract highlight entries for a specific file from the scan's file_report.

    Each file_report entry looks like:
      { "file": "app/routes/contributions.js",
        "language": "javascript",
        "issues": [
            { "type": "JavaScript eval()",
              "severity": "High",
              "matches_found": 4,
              "line": 42,
              ... }
        ]
      }

    Returns:
        [ { "line": 42, "severity": "High", "type": "JavaScript eval()" }, ... ]
    """
    highlights: List[Dict[str, Any]] = []
    for item in file_report:
        if item.get("file") != file_path:
            continue
        for issue in item.get("issues", []):
            highlights.append({
                "line": issue.get("line", 1),
                "severity": issue.get("severity", "Low"),
                "type": issue.get("type", "Unknown"),
            })
    return highlights
