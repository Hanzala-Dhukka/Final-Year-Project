"""
Module E2 — Code Snippet Extraction
Works with in-memory content (list of lines), not file paths,
because files are downloaded from GitHub as strings.
"""

CONTEXT_LINES = 2  # lines before and after the vulnerable line


def extract_code_context(lines: list[str], line_number: int, context: int = CONTEXT_LINES) -> list[dict]:
    """
    Extract surrounding code context for a given 1-based line number.

    Args:
        lines:       File content already split into lines (strings).
        line_number: 1-based line number of the vulnerable match.
        context:     Number of surrounding lines to include before and after.

    Returns:
        List of dicts with keys: line, code, is_vulnerable
    """
    start = max(0, line_number - context - 1)
    end = min(len(lines), line_number + context)

    result = []
    for idx in range(start, end):
        result.append({
            "line": idx + 1,
            "code": lines[idx].rstrip(),
            "is_vulnerable": (idx + 1 == line_number)
        })
    return result


def get_snippet(lines: list[str], line_number: int) -> str:
    """
    Return the single vulnerable line stripped of leading/trailing whitespace.

    Args:
        lines:       File content already split into lines (strings).
        line_number: 1-based line number.

    Returns:
        The stripped source line, or empty string if out of range.
    """
    try:
        return lines[line_number - 1].strip()
    except IndexError:
        return ""
