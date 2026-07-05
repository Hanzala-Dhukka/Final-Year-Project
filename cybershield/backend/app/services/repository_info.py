import requests
import os
import re
from app.config.settings import settings

def extract_repo_name(repo_url: str) -> str:
    url_or_path = repo_url.strip().rstrip("/")
    if url_or_path.endswith(".git"):
        url_or_path = url_or_path[:-4]
        
    pattern1 = r"^https?://(?:www\.)?github\.com/([^/]+)/([^/]+)$"
    pattern2 = r"^git@github\.com:([^/]+)/([^/]+)$"
    pattern3 = r"^(?:www\.)?github\.com/([^/]+)/([^/]+)$"
    pattern4 = r"^([^/]+)/([^/]+)$"
    
    for pattern in [pattern1, pattern2, pattern3, pattern4]:
        match = re.match(pattern, url_or_path, re.IGNORECASE)
        if match:
            owner, repo = match.groups()
            valid_char = re.compile(r"^[a-zA-Z0-9\-_\.]+$")
            if valid_char.match(owner) and valid_char.match(repo):
                return f"{owner}/{repo}"
                
    raise ValueError("Invalid GitHub repository URL.")

def get_repository_info(repo_url: str) -> dict:
    try:
        repo_name = extract_repo_name(repo_url)
    except ValueError:
        raise ValueError("Invalid GitHub repository URL.")
        
    parts = repo_name.split("/")
    owner, repo = parts[0], parts[1]

    url = f"https://api.github.com/repos/{owner}/{repo}"
    
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "CyberShield-App"
    }
    
    token = settings.GITHUB_TOKEN or os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"token {token}"

    try:
        response = requests.get(url, headers=headers, timeout=10)
    except Exception as e:
        raise ValueError(f"Could not connect to GitHub API: {str(e)}")
    
    # Fallback to unauthorized request if GITHUB_TOKEN is faulty / expired (401/403)
    if response.status_code in [401, 403] and token:
        is_rate_limit = False
        if "x-ratelimit-remaining" in response.headers:
            try:
                if int(response.headers["x-ratelimit-remaining"]) == 0:
                    is_rate_limit = True
            except Exception:
                pass
        if "rate limit exceeded" in response.text.lower():
            is_rate_limit = True
            
        if is_rate_limit:
            raise ValueError("GitHub API rate limit exceeded.")
        
        headers.pop("Authorization", None)
        try:
            response = requests.get(url, headers=headers, timeout=10)
        except Exception as e:
            raise ValueError(f"Could not connect to GitHub API: {str(e)}")

    if response.status_code == 404:
        raise ValueError("Repository not found.")
    elif response.status_code in [403, 429]:
        raise ValueError("GitHub API rate limit exceeded.")
    elif response.status_code != 200:
        raise ValueError(f"Could not retrieve repository info from GitHub API (Status {response.status_code})")

    data = response.json()

    # Query last_commit from commits endpoint
    last_commit_date = ""
    default_branch = data.get("default_branch", "main")
    commits_url = f"https://api.github.com/repos/{owner}/{repo}/commits?sha={default_branch}&per_page=1"
    try:
        commits_resp = requests.get(commits_url, headers=headers, timeout=10)
        if commits_resp.status_code == 200:
            commits = commits_resp.json()
            if commits and len(commits) > 0:
                last_commit_date = commits[0].get("commit", {}).get("committer", {}).get("date", "")
    except Exception:
        pass

    license_data = data.get("license") or {}
    license_name = license_data.get("name") or license_data.get("key") or "Unknown"

    return {
        "repository": data.get("full_name") or repo_name,
        "owner": data.get("owner", {}).get("login", owner),
        "description": data.get("description") or "",
        "default_branch": default_branch,
        "stars": data.get("stargazers_count", 0),
        "forks": data.get("forks_count", 0),
        "open_issues": data.get("open_issues_count", 0),
        "language": data.get("language") or "",
        "license": license_name,
        "topics": data.get("topics", []),
        "created_at": data.get("created_at") or "",
        "updated_at": data.get("updated_at") or "",
        "last_commit": last_commit_date,
        "visibility": "private" if data.get("private") else "public"
    }
