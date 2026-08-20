"""
GitHub analysis service — orchestrates parsing, analysis, and MongoDB storage.
"""
from datetime import datetime
from github import GithubException, RateLimitExceededException

from app.database.db import database
from app.github.parser import (
    get_repository,
    repository_metadata,
    get_branches,
    get_languages,
    scan_tree,
    get_contributors_count,
)
from app.github.analyzer import build_analysis
from app.services.error_log_service import fire_and_forget_log


async def analyze_repository(repo_name: str, user_id: str) -> dict:
    """
    Full repository analysis pipeline:
    1. Validate & fetch repository
    2. Extract metadata, branches, languages, file tree
    3. Compute statistics and detect dependencies
    4. Store results in MongoDB
    5. Return analysis
    """
    # 1. Fetch repository
    try:
        repo = get_repository(repo_name)
    except (GithubException, RateLimitExceededException) as e:
        fire_and_forget_log()
        status_code = getattr(e, "status", None)
        if status_code == 404:
            raise ValueError("Repository not found. Check the URL and try again.")
        elif status_code in (403, 429):
            raise ValueError("GitHub API rate limit exceeded. Please wait or configure a GITHUB_TOKEN.")
        else:
            raise ValueError(f"GitHub API error: {str(e)}")
    except Exception as e:
        fire_and_forget_log()
        raise ValueError(f"Could not access repository: {str(e)}")

    # 2. Extract data
    try:
        metadata = repository_metadata(repo)
    except Exception as e:
        fire_and_forget_log()
        raise ValueError(f"Error reading repository metadata: {str(e)}")

    try:
        branches = get_branches(repo)
    except Exception as e:
        fire_and_forget_log()
        raise ValueError(f"Error reading branches: {str(e)}")

    try:
        languages = get_languages(repo)
    except Exception as e:
        fire_and_forget_log()
        raise ValueError(f"Error reading languages: {str(e)}")

    try:
        file_paths = scan_tree(repo)
    except Exception as e:
        fire_and_forget_log()
        raise ValueError(f"Error scanning file tree: {str(e)}")

    try:
        contributors = get_contributors_count(repo)
    except Exception as e:
        fire_and_forget_log()
        raise ValueError(f"Error reading contributors: {str(e)}")

    # 3. Build analysis
    analysis = build_analysis(metadata, branches, languages, file_paths, contributors)

    # 4. Store in MongoDB
    document = {
        "user_id": user_id,
        **analysis,
        "status": "ready",
        "created_at": datetime.utcnow(),
    }
    collection = database["repository_analysis"]
    result = await collection.insert_one(document)

    # 5. Return a clean, JSON-serializable response
    return {
        "id": str(result.inserted_id),
        "user_id": user_id,
        **analysis,
        "status": "ready",
        "created_at": document["created_at"].isoformat(),
    }


async def get_analysis_history(user_id: str) -> list:
    """Get recent repository analyses for a user."""
    collection = database["repository_analysis"]
    cursor = collection.find({"user_id": user_id}).sort("created_at", -1).limit(50)
    docs = await cursor.to_list(length=50)
    for doc in docs:
        doc["_id"] = str(doc["_id"])
        # Convert datetime to ISO string for JSON serialization
        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()
    return docs


async def get_analysis_by_id(analysis_id: str) -> dict:
    """Get a specific analysis by its MongoDB _id."""
    from bson import ObjectId
    collection = database["repository_analysis"]
    doc = await collection.find_one({"_id": ObjectId(analysis_id)})
    if doc:
        doc["_id"] = str(doc["_id"])
        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()
    return doc
