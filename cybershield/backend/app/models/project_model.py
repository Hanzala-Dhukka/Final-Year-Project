"""
Project document model and role/permission matrix (Module 4.5).
"""
from datetime import datetime
from typing import Dict, List

# ── Roles ─────────────────────────────────────────────────────────────────────
ROLES = ["Owner", "Admin", "Developer", "Viewer"]

# Permission matrix: action -> roles allowed
PERMISSIONS: Dict[str, List[str]] = {
    "view_project": ["Owner", "Admin", "Developer", "Viewer"],
    "edit_project": ["Owner", "Admin"],
    "run_analysis": ["Owner", "Admin", "Developer"],
    "delete_report": ["Owner", "Admin"],
    "invite_members": ["Owner", "Admin"],
    "add_comments": ["Owner", "Admin", "Developer", "Viewer"],
    "manage_members": ["Owner", "Admin"],
}


def can(role: str, action: str) -> bool:
    """Return True if the given role is permitted to perform the action."""
    return action in PERMISSIONS and role in PERMISSIONS[action]


def build_project_doc(owner_id: str, name: str, description: str,
                      tech_stack: List[str], status: str = "Active") -> dict:
    """Construct a new project document."""
    return {
        "owner_id": owner_id,
        "name": name,
        "description": description,
        "tech_stack": tech_stack or [],
        "status": status,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


def build_member_doc(project_id: str, user_id: str, role: str) -> dict:
    """Construct a project membership document."""
    return {
        "project_id": project_id,
        "user_id": user_id,
        "role": role,
        "joined_at": datetime.utcnow(),
    }
