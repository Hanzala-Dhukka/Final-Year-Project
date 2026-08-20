"""
GitHub repository parser — fetches metadata, branches, languages, and file trees.
"""
from github import Github, GithubException, RateLimitExceededException
from typing import Optional
import time

from app.config.settings import settings
from app.github.utils import bytes_to_percentage
from app.services.error_log_service import fire_and_forget_log


_github: Optional[Github] = None


def _get_client() -> Github:
    """Get or create a shared PyGithub client."""
    global _github
    if _github is None:
        _github = Github(settings.GITHUB_TOKEN) if settings.GITHUB_TOKEN else Github()
    return _github


def _check_rate_limit(client: Github):
    """Raise if GitHub API rate limit is nearly exhausted."""
    try:
        rate_limit = client.get_rate_limit().resources.core
        if rate_limit.remaining < 10:
            reset_ts = time.strftime("%H:%M:%S", time.localtime(rate_limit.reset.timestamp()))
            raise Exception(
                f"GitHub API rate limit exceeded. Resets at {reset_ts}. "
                "Set GITHUB_TOKEN for higher limits."
            )
    except Exception as e:
        fire_and_forget_log()
        if "rate limit" in str(e).lower():
            raise


def validate_repository(repo_name: str) -> dict:
    """
    Validate that a GitHub repository exists and is accessible.

    Returns a dict with ``ok`` (bool) and, when ``ok`` is False, an
    ``error`` message explaining the failure reason.
    """
    client = _get_client()
    try:
        client.get_repo(repo_name)
        return {"ok": True}
    except RateLimitExceededException:
        fire_and_forget_log()
        return {"ok": False, "error": "GitHub API rate limit exceeded. Please wait or configure a GITHUB_TOKEN."}
    except GithubException as e:
        fire_and_forget_log()
        status = getattr(e, "status", None)
        if status == 404:
            return {"ok": False, "error": "Repository not found. Check the URL and try again."}
        if status in (403, 401):
            return {"ok": False, "error": "Access denied. The repository may be private or the GitHub token lacks permissions."}
        return {"ok": False, "error": f"GitHub API error (HTTP {status})."}
    except Exception as e:
        fire_and_forget_log()
        return {"ok": False, "error": f"Could not reach GitHub: {e}"}


def get_repository(repo_name: str):
    """Fetch a PyGithub Repository object."""
    client = _get_client()
    _check_rate_limit(client)
    return client.get_repo(repo_name)


def repository_metadata(repo) -> dict:
    """Extract repository metadata from a PyGithub Repo object."""
    # Defensive: ensure numeric fields are actually numeric
    try:
        raw_size = int(repo.size) if repo.size else 0
    except (TypeError, ValueError):
        fire_and_forget_log()
        raw_size = 0

    return {
        "name": repo.name,
        "full_name": repo.full_name,
        "owner": repo.owner.login,
        "description": repo.description or "",
        "stars": int(repo.stargazers_count) if repo.stargazers_count else 0,
        "forks": int(repo.forks_count) if repo.forks_count else 0,
        "open_issues": int(repo.open_issues_count) if repo.open_issues_count else 0,
        "language": repo.language or "",
        "size": round(raw_size / 1024, 1),  # Convert KB to MB
        "default_branch": repo.default_branch,
        "visibility": "private" if repo.private else "public",
        "created_at": repo.created_at.isoformat() if repo.created_at else "",
        "updated_at": repo.updated_at.isoformat() if repo.updated_at else "",
        "topics": repo.topics or [],
        "archived": repo.archived,
    }


def get_branches(repo) -> list:
    """Get all branch names for the repository."""
    branches = []
    for branch in repo.get_branches():
        branches.append(branch.name)
    return branches


def get_languages(repo) -> dict:
    """Get language byte counts, converted to percentages."""
    raw = repo.get_languages()
    return bytes_to_percentage(raw)


def get_languages_raw(repo) -> dict:
    """Get raw language byte counts (before percentage conversion)."""
    return repo.get_languages()


def scan_tree(repo, path: str = "") -> list:
    """Get all file paths in the repository using the Git Tree API (single call)."""
    try:
        tree = repo.get_git_tree(repo.default_branch, recursive=True)
        return [item.path for item in tree.tree if item.type == "blob"]
    except GithubException:
        fire_and_forget_log()
        # Fallback to manual scan for any tree API errors
        return _scan_tree_manual(repo, path)


def _scan_tree_manual(repo, path: str = "") -> list:
    """Fallback: recursively scan the repository file tree via get_contents."""
    files = []
    try:
        contents = repo.get_contents(path)
    except GithubException:
        fire_and_forget_log()
        return files

    if not isinstance(contents, list):
        if hasattr(contents, "path"):
            files.append(contents.path)
        return files

    while contents:
        file = contents.pop(0)
        if file.type == "dir":
            try:
                dir_contents = repo.get_contents(file.path)
                if isinstance(dir_contents, list):
                    contents.extend(dir_contents)
                elif hasattr(dir_contents, "path"):
                    files.append(dir_contents.path)
            except GithubException:
                fire_and_forget_log()
                pass
        else:
            files.append(file.path)
    return files


def get_contributors_count(repo) -> int:
    """Get the number of contributors without loading the full list."""
    try:
        # Use the paginated iterator but only count the first page
        # to avoid excessive API calls on large repos
        count = 0
        for _ in repo.get_contributors():
            count += 1
            if count >= 100:  # Cap at 100 to avoid rate limits
                break
        return count
    except Exception:
        fire_and_forget_log()
        return 0
