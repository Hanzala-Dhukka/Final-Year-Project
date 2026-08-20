"""
Location Engine — Module D6

Provides precise file, line, column, end_line, end_column detection
for every pattern match in source code.
"""

import re
from typing import List, Dict, Optional, Tuple

from app.services.error_log_service import fire_and_forget_log


def _offset_to_line_col(content: str, offset: int) -> Tuple[int, int]:
    """Convert a character offset to 1-based (line, column)."""
    line = content[:offset].count('\n') + 1
    last_newline = content.rfind('\n', 0, offset)
    return line, offset - last_newline


def find_pattern_locations(
    content: str,
    pattern: str,
    file_path: str = "",
) -> List[Dict]:
    """
    Find all locations where a regex pattern matches in the file content.

    Returns a list of dicts, each with:
    - line: int (1-based)
    - end_line: int (1-based)
    - column: int (1-based)
    - end_column: int (1-based)
    - matched_text: str
    - line_content: str (the full line)
    """
    locations = []
    lines = content.splitlines(keepends=True)

    try:
        compiled = re.compile(pattern, re.IGNORECASE)
    except re.error:
        fire_and_forget_log()
        return locations

    for match in compiled.finditer(content):
        start = match.start()
        end = match.end()

        line, col = _offset_to_line_col(content, start)
        end_line, end_col = _offset_to_line_col(content, end)

        line_content = ""
        if 1 <= line <= len(lines):
            line_content = lines[line - 1]

        locations.append({
            "line": line,
            "end_line": end_line,
            "column": col,
            "end_column": end_col,
            "matched_text": match.group(0),
            "line_content": line_content,
        })

    return locations


def find_all_pattern_locations(
    content: str,
    patterns: List[str],
    file_path: str = "",
) -> List[Dict]:
    """Find locations for multiple patterns (primary + alt_patterns)."""
    all_locations = []
    seen = set()

    for pattern_str in patterns:
        locs = find_pattern_locations(content, pattern_str, file_path)
        for loc in locs:
            key = (loc["line"], loc["column"])
            if key not in seen:
                seen.add(key)
                all_locations.append(loc)

    return all_locations
