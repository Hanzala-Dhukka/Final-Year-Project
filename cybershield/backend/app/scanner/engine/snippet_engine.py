"""
Snippet Engine — Module D6

Extracts contextual code snippets around vulnerability findings.
"""

from typing import List, Dict


CONTEXT_LINES_BEFORE = 3
CONTEXT_LINES_AFTER = 2


def extract_snippet(
    lines: List[str],
    line_number: int,
    before: int = CONTEXT_LINES_BEFORE,
    after: int = CONTEXT_LINES_AFTER,
) -> str:
    """
    Extract a code snippet with context lines around the finding.

    Args:
        lines: List of file lines (0-indexed list)
        line_number: 1-based line number of the finding
        before: Number of context lines before
        after: Number of context lines after

    Returns:
        Formatted snippet string with line numbers
    """
    start = max(0, line_number - 1 - before)
    end = min(len(lines), line_number + after)

    snippet_lines = []
    for i in range(start, end):
        line_num = i + 1
        prefix = ">>> " if i == line_number - 1 else "    "
        snippet_lines.append(f"{prefix}{line_num:>4} | {lines[i].rstrip()}")

    return "\n".join(snippet_lines)


def extract_multiline_snippet(
    lines: List[str],
    start_line: int,
    end_line: int,
    context: int = 2,
) -> str:
    """Extract snippet for multi-line findings with context."""
    start = max(0, start_line - 1 - context)
    end = min(len(lines), end_line + context)

    snippet_lines = []
    for i in range(start, end):
        line_num = i + 1
        if start_line <= line_num <= end_line:
            prefix = ">>> "
        else:
            prefix = "    "
        snippet_lines.append(f"{prefix}{line_num:>4} | {lines[i].rstrip()}")

    return "\n".join(snippet_lines)


def get_file_lines(content: str) -> List[str]:
    """Split file content into lines."""
    return content.splitlines(keepends=True)
