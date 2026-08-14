"""
Helpers for resolving a user's display name from a user document.

User documents may store their name under `full_name`, `name`, or
`username` depending on how the account was created/updated. These helpers
pick the first non-empty field so project pages always show a real name.
"""


def display_name(user_doc, fallback: str = "User") -> str:
    """Return the best available display name for a user document."""
    if not user_doc:
        return fallback
    for key in ("full_name", "name", "username"):
        value = user_doc.get(key)
        if value:
            return str(value).strip() or fallback
    email = user_doc.get("email")
    if email:
        return str(email).split("@")[0]
    return fallback
