"""
JSON Report Generator — Module D5

Exports the full report data as a formatted JSON file with proper datetime serialization.
"""

import json
import os
from datetime import datetime, timezone


class _DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder that serializes datetime objects to ISO 8601 strings."""

    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if hasattr(obj, "isoformat"):
            return obj.isoformat()
        return super().default(obj)


def generate_report_json(report_data: dict, output_path: str) -> str:
    """
    Generate a formatted JSON report with proper datetime serialization.

    Returns the output_path on success.
    """
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    # Strip MongoDB _id if present (not JSON serializable)
    clean_data = {k: v for k, v in report_data.items() if k != "_id"}

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(
            clean_data,
            f,
            indent=2,
            ensure_ascii=False,
            cls=_DateTimeEncoder,
        )

    return output_path
