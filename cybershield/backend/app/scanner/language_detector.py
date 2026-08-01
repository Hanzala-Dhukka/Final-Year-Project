"""
Module E2 — Language Detector
Detects the programming language from a file path extension.
"""
import os

EXTENSION_MAP = {
    ".js":   "javascript",
    ".jsx":  "javascript",
    ".mjs":  "javascript",
    ".cjs":  "javascript",
    ".ts":   "typescript",
    ".tsx":  "typescript",
    ".vue":  "javascript",
    ".py":   "python",
    ".pyw":  "python",
    ".java": "java",
    ".go":   "golang",
    ".php":  "php",
    ".rb":   "ruby",
    ".rs":   "rust",
    ".cs":   "csharp",
    ".cpp":  "cpp",
    ".c":    "c",
    ".sh":   "bash",
    ".yaml": "yaml",
    ".yml":  "yaml",
    ".json": "json",
    ".env":  "plaintext",
    ".txt":  "plaintext",
    ".md":   "markdown",
}


def detect_language(file_path: str) -> str:
    """
    Return the language string for the given file path.
    Falls back to 'text' if the extension is unknown.
    """
    if not file_path:
        return "text"
    ext = os.path.splitext(file_path)[1].lower()
    return EXTENSION_MAP.get(ext, "text")
