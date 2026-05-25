from fastapi import APIRouter, HTTPException 
from github import Github 
import concurrent.futures
import time
import requests
from datetime import datetime 
from app.database.db import database 
 
from app.config.settings import settings
from app.services.github_scanner import ( 
    scan_file_content 
) 
 
router = APIRouter() 
 
# Initialize the GitHub client with a token if available to avoid rate limits
GITHUB_TOKEN = settings.GITHUB_TOKEN
github_client = Github(GITHUB_TOKEN) if GITHUB_TOKEN else Github() 

# Print token status to terminal on startup (masked for security)
if GITHUB_TOKEN:
    print(f"DEBUG: GitHub Token detected: {GITHUB_TOKEN[:10]}...{GITHUB_TOKEN[-4:]}")
else:
    print("DEBUG: No GitHub Token detected. Running in unauthenticated mode (60 req/hr limit)")


def scan_single_file(repo_full_name, branch, file_path):
    """Helper function to fetch raw content and scan a single file"""
    try:
        # Using raw.githubusercontent.com bypasses the GitHub API rate limit for file contents
        raw_url = f"https://raw.githubusercontent.com/{repo_full_name}/{branch}/{file_path}"
        
        response = requests.get(raw_url, timeout=10)
        
        if response.status_code != 200:
            return None
            
        # Skip if file is too large (e.g. > 1MB)
        if len(response.content) > 1000000:
            return None

        decoded_content = response.text
        
        result = scan_file_content(decoded_content) 
        
        if result: 
            return { 
                "file": file_path, 
                "issues": result 
            }
    except Exception:
        pass
    return None


@router.post("/scan-repository") 
async def scan_repository(data: dict): 
 
    repo_url = data.get("repo_url") 
 
    if not repo_url: 
        raise HTTPException( 
            status_code=400, 
            detail="Repository URL is required" 
        ) 
 
    try: 
        # Check current rate limit status before starting
        remaining, limit = github_client.rate_limiting
        if remaining == 0:
            reset_timestamp = github_client.rate_limiting_resettime
            reset_time = datetime.fromtimestamp(reset_timestamp)
            raise HTTPException(
                status_code=403,
                detail=f"GitHub API Rate limit exceeded. Resets at {reset_time.strftime('%H:%M:%S')} UTC. Please check your token."
            )

        # Clean up the URL to get the path (owner/repo)
        repo_path = repo_url.replace("https://github.com/", "")
        repo_path = repo_path.replace("`", "").strip().strip("/")
 
        repo = github_client.get_repo(repo_path) 
        repo_full_name = repo.full_name
        default_branch = repo.default_branch
        
        # 1. Use Recursive Tree API to get all file paths (Only 1 API call!)
        tree = repo.get_git_tree(default_branch, recursive=True)
        
        # 2. Filter for files only and apply basic exclusions
        file_paths = []
        excluded_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.bin', '.exe', '.zip', '.tar', '.gz', '.svg', '.woff', '.woff2', '.ttf', '.eot'}
        excluded_dirs = {'node_modules', '.git', '__pycache__', 'dist', 'build', 'vendor'}
        
        for item in tree.tree:
            if item.type == "blob": # It's a file
                if any(part in excluded_dirs for part in item.path.split('/')):
                    continue
                if any(item.path.lower().endswith(ext) for ext in excluded_extensions):
                    continue
                file_paths.append(item.path)

        # 3. Increase limit since raw fetches don't count towards API quota
        MAX_FILES_TO_SCAN = 2000
        if len(file_paths) > MAX_FILES_TO_SCAN:
            file_paths = file_paths[:MAX_FILES_TO_SCAN]

        findings = [] 
        scanned_files = 0 

        # 4. Use Concurrency to fetch raw contents in parallel
        # We can use more workers now because we aren't hitting the GitHub API
        with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
            future_to_file = {
                executor.submit(scan_single_file, repo_full_name, default_branch, path): path 
                for path in file_paths
            }
            
            for future in concurrent.futures.as_completed(future_to_file):
                try:
                    result = future.result()
                    scanned_files += 1
                    if result:
                        findings.append(result)
                except Exception:
                    continue
 
        scan_collection = database["github_scans"] 
 
        scan_data = { 
            "repository": repo.full_name, 
            "scanned_files": scanned_files, 
            "vulnerabilities_found": len(findings), 
            "findings": findings, 
            "created_at": datetime.utcnow() 
        } 
 
        await scan_collection.insert_one(scan_data)

        return { 
            "repository": repo.full_name, 
            "scanned_files": scanned_files, 
            "vulnerabilities_found": len(findings), 
            "findings": findings 
        } 
 
    except Exception as e: 
        error_msg = str(e)
        
        # Handle Network/DNS issues
        if "getaddrinfo failed" in error_msg or "NameResolutionError" in error_msg:
            error_msg = "Network Error: Could not resolve 'api.github.com'. Please check your internet connection or DNS settings."
        
        elif "403" in error_msg:
            error_msg = "GitHub API rate limit exceeded or access forbidden. Please check your GITHUB_TOKEN or wait a few minutes."
        
        raise HTTPException( 
            status_code=500, 
            detail=error_msg
        )


@router.get("/scan-history")
async def get_scan_history():
    try:
        scan_collection = database["github_scans"]
        
        # Fetch scans sorted by newest first
        scans = await scan_collection.find().sort("created_at", -1).to_list(length=100)
        
        # Convert MongoDB _id to string for JSON serialization
        for scan in scans:
            scan["_id"] = str(scan["_id"])
            
        return scans
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

