from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse 
from github import Github, GithubException, BadCredentialsException
import concurrent.futures
import time
import requests
from datetime import datetime 
from bson import ObjectId
from app.database.db import database 
 
from app.config.settings import settings
from app.services.github_scanner import ( 
    scan_file_content,
    detect_technology,
    scan_dangerous_code
) 
from app.services.report_generator import ( 
    generate_security_report 
) 
from app.services.pdf_generator import ( 
    generate_pdf_report 
) 
from app.services.risk_engine import (
    calculate_risk_score
)
from app.utils.dependencies import verify_token
 
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
        
        secret_findings = scan_file_content(
            decoded_content
        )

        code_findings = scan_dangerous_code(
            decoded_content
        )

        result = (
            secret_findings +
            code_findings
        )
        
        if result: 
            return { 
                "file": file_path, 
                "issues": result 
            }
    except Exception:
        pass
    return None


import traceback

@router.post("/scan-repository") 
async def scan_repository(
    data: dict,
    user_data: dict = Depends(verify_token)
): 
    global github_client
 
    repo_url = data.get("repo_url") 
 
    if not repo_url: 
        raise HTTPException( 
            status_code=400, 
            detail="Repository URL is required" 
        ) 
 
    try: 
        # Check current rate limit status before starting
        try:
            remaining, limit = github_client.rate_limiting
        except BadCredentialsException:
            # If credentials are bad, fallback to unauthenticated client if possible
            # or raise a clear error
            if GITHUB_TOKEN:
                print("ERROR: GitHub Token is invalid. Falling back to unauthenticated mode.")
                github_client = Github()
                remaining, limit = github_client.rate_limiting
            else:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid GitHub credentials. Please check your GITHUB_TOKEN."
                )
        except Exception as e:
            print(f"DEBUG: Unexpected error checking rate limit: {str(e)}")
            # Continue anyway, let subsequent calls fail if it's a real issue
            remaining, limit = 60, 60 # Default for unauthenticated
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
        
        detected_technologies = set()

        class FileContent:
            def __init__(self, name):
                self.name = name

        for item in tree.tree:
            if item.type == "blob": # It's a file
                if any(part in excluded_dirs for part in item.path.split('/')):
                    continue
                if any(item.path.lower().endswith(ext) for ext in excluded_extensions):
                    continue
                file_paths.append(item.path)

                file_content = FileContent(item.path.split('/')[-1])
                technology = detect_technology(
                    file_content.name
                )
                if technology:
                    detected_technologies.add(
                        technology
                    )

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
 
        risk_score = calculate_risk_score(
            findings
        )

        scan_collection = database["github_scans"]

        scan_data = { 
            "user_id": ObjectId(user_data["user_id"]),
            "repository": repo.full_name, 
            "scanned_files": scanned_files, 
            "vulnerabilities_found": len(findings), 
            "findings": findings, 
            "technologies": list(
                detected_technologies
            ),
            "risk_score": risk_score,
            "created_at": datetime.utcnow() 
        } 
 
        await scan_collection.insert_one(scan_data)

        report = generate_security_report({ 
            "findings": findings 
        }) 

        return { 
            "repository": repo.full_name, 
            "scanned_files": scanned_files, 
            "vulnerabilities_found": len(findings), 
            "findings": findings, 
            "technologies": list(
                detected_technologies
            ),
            "risk_score": risk_score,
            "report": report 
        } 
 
    except Exception as e: 
        print(f"ERROR in scan_repository: {str(e)}")
        traceback.print_exc()
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


@router.post("/generate-report") 
async def generate_report(
    data: dict,
    user_data: dict = Depends(verify_token)
): 
 
    report = data.get("report") 
    title = data.get("title", "GitHub Security Report")
 
    if not report: 
 
        raise HTTPException( 
            status_code=400, 
            detail="Report data required" 
        ) 
 
    # Save to database
    reports_collection = database["security_reports"]
    report_document = {
        "user_id": ObjectId(user_data["user_id"]),
        "report_data": report,
        "title": title,
        "risk_level": report.get("risk_level", "Unknown"),
        "summary": report.get("summary", ""),
        "report_type": "github_scan",
        "created_at": datetime.utcnow()
    }
    
    await reports_collection.insert_one(report_document)

    output_path = "security_report.pdf" 
 
    generate_pdf_report( 
        report, 
        output_path 
    ) 
 
    return FileResponse( 
        output_path, 
        media_type="application/pdf", 
        filename=f"{title.replace(' ', '_')}.pdf" 
    )


@router.get("/scan-history")
async def get_scan_history(user_data: dict = Depends(verify_token)):
    try:
        scan_collection = database["github_scans"]
        
        # Fetch scans for this user OR legacy scans with no valid user_id
        scans = await scan_collection.find({
            "$or": [
                {"user_id": ObjectId(user_data["user_id"])},
                {"user_id": {"$exists": False}},
                {"user_id": None},
                {"user_id": ""}
            ]
        }).sort("created_at", -1).to_list(length=100)
        
        # Convert MongoDB _id to string for JSON serialization
        for scan in scans:
            scan["_id"] = str(scan["_id"])
            if "user_id" in scan:
                scan["user_id"] = str(scan["user_id"])
            
        return scans
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/reports")
async def get_reports(user_data: dict = Depends(verify_token)):

    reports_collection = database[
        "security_reports"
    ]

    reports = await reports_collection.find({
        "$or": [
            {"user_id": ObjectId(user_data["user_id"])},
            {"user_id": {"$exists": False}},
            {"user_id": None},
            {"user_id": ""}
        ]
    }).sort(
        "created_at",
        -1
    ).to_list(100)

    for report in reports:
        report["_id"] = str(
            report["_id"]
        )
        if "user_id" in report:
            report["user_id"] = str(report["user_id"])

    return reports

