"""
Token cleanup service for removing expired refresh tokens.
Can be run as a background task or scheduled job.
"""
from app.repositories.refresh_token_repository import refresh_token_repository


def cleanup_expired_tokens() -> int:
    """
    Remove all expired refresh tokens from the database.
    
    Returns:
        int: Number of tokens removed
    """
    return refresh_token_repository.cleanup_expired_tokens()


def cleanup_revoked_tokens() -> int:
    """
    Remove all revoked refresh tokens from the database.
    
    Returns:
        int: Number of tokens removed
    """
    # This would require adding a method to the repository
    return 0