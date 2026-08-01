"""
GitHub Repository Analysis API routes.
"""
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from app.dependencies.auth import get_current_user
from app.github.utils import extract_repo_name
from app.github.parser import validate_repository
from app.github.github_service import analyze_repository, get_analysis_history, get_analysis_by_id
from app.github.analyzer import detect_dependency_files, extract_dependency_names, compute_file_statistics

router = APIRouter()


@router.post("/validate")
async def validate_repo(data: dict, current_user: dict = Depends(get_current_user)):
    """Validate that a GitHub repository URL is accessible."""
    repo_url = data.get("repository", "")
    if not repo_url:
        raise HTTPException(status_code=400, detail="Repository URL is required")

    try:
        repo_name = extract_repo_name(repo_url)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid GitHub repository URL format.")

    is_valid = validate_repository(repo_name)
    if not is_valid:
        raise HTTPException(status_code=404, detail="Repository not found or not accessible.")

    return {"valid": True, "repository": repo_name}


@router.post("/analyze")
async def analyze_repo(data: dict, current_user: dict = Depends(get_current_user)):
    """Full repository analysis: metadata, branches, languages, file tree, dependencies, statistics."""
    repo_url = data.get("repository", "")
    if not repo_url:
        raise HTTPException(status_code=400, detail="Repository URL is required")

    try:
        repo_name = extract_repo_name(repo_url)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid GitHub repository URL format.")

    try:
        result = await analyze_repository(repo_name, current_user["_id"])
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/analysis/history")
async def analysis_history(current_user: dict = Depends(get_current_user)):
    """Get recent repository analysis history for the current user."""
    try:
        history = await get_analysis_history(current_user["_id"])
        # Clean up MongoDB fields for response
        for item in history:
            if "_id" in item:
                item["id"] = item.pop("_id")
            # Remove file_tree from list view to keep response small
            item.pop("file_tree", None)
            # Convert datetime to string if still a datetime object
            if isinstance(item.get("created_at"), datetime):
                item["created_at"] = item["created_at"].isoformat()
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analysis/{analysis_id}")
async def get_analysis(analysis_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific analysis by ID."""
    try:
        result = await get_analysis_by_id(analysis_id)
        if not result:
            raise HTTPException(status_code=404, detail="Analysis not found.")
        if "_id" in result:
            result["id"] = result.pop("_id")
        from datetime import datetime
        if isinstance(result.get("created_at"), datetime):
            result["created_at"] = result["created_at"].isoformat()
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
