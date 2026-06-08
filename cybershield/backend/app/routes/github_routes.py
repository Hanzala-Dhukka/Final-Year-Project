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
from app.services.threat_analyzer import ( 
    generate_summary, 
    calculate_risk_level,
    risk_level_from_score,
    generate_ai_report
)
from app.dependencies.auth import get_current_user
 
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

@router.post( 
    "/generate-threat-report" 
) 
async def generate_threat_report( 
    data: dict 
): 
 
    findings = data["findings"] 
    files_scanned = data.get("files_scanned", 0)
    risk_score = calculate_risk_score([{"issues": findings}])
 
    return generate_ai_report(findings, files_scanned, risk_score)

@router.post("/scan-repository") 
async def scan_repository(
    data: dict,
    current_user: dict = Depends(get_current_user)
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
            rate_limit = github_client.get_rate_limit().resources.core
            if rate_limit.remaining < 5:
                reset_time = time.strftime('%H:%M:%S', time.localtime(rate_limit.reset.timestamp()))
                raise HTTPException(
                    status_code=429,
                    detail=f"GitHub API rate limit nearly exhausted. Resets at {reset_time}."
                )
        except HTTPException:
            raise
        except (BadCredentialsException, GithubException):
            # Token is invalid/expired — fall back to unauthenticated mode
            print("WARNING: GitHub token is invalid or expired. Falling back to unauthenticated mode (60 req/hr).")
            github_client = Github()
        except Exception:
            pass

        repo_name = repo_url.split("github.com/")[-1].strip("/")

        # Try with current client; if credentials fail, retry without token
        try:
            repo = github_client.get_repo(repo_name)
        except BadCredentialsException:
            print("WARNING: GitHub token rejected on get_repo. Retrying without token.")
            github_client = Github()
            repo = github_client.get_repo(repo_name)
        
        # Get all files using git tree to be more efficient
        default_branch = repo.default_branch
        tree = repo.get_git_tree(default_branch, recursive=True)
        
        files_to_scan = [
            item.path for item in tree.tree 
            if item.type == "blob" and (
                item.path.endswith((".py", ".js", ".env", ".yml", ".json", ".txt", ".sh")) or
                "config" in item.path.lower()
            )
        ]

        # Limit to 100 files to avoid timeouts
        files_to_scan = files_to_scan[:100]

        file_results = []
        technologies = set()

        # Parallelize file scanning for speed
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            future_to_file = {
                executor.submit(scan_single_file, repo_name, default_branch, f): f 
                for f in files_to_scan
            }
            
            for future in concurrent.futures.as_completed(future_to_file):
                result = future.result()
                if result:
                    file_results.append(result)
                    # Extract technology from file extension
                    tech = detect_technology(result["file"])
                    if tech: technologies.add(tech)

        risk_score = calculate_risk_score(file_results)
        
        # Extract all issues for threat analysis
        findings = []
        for f in file_results:
            findings.extend(f["issues"])

        # Generate threat analysis
        ai_report = generate_ai_report(findings, len(files_to_scan), risk_score)
        risk_level = ai_report["risk_level"]
        summary = ai_report["summary"]

        report_data = {
            "repository": repo_name,
            "findings": file_results,
            "technologies": list(technologies),
            "risk_score": risk_score,
            "summary": summary,
            "risk_level": risk_level,
            "ai_report": ai_report
        }
        report = generate_security_report(report_data)

        # Save scan to database
        scan_collection = database["github_scans"]
        scan_document = { 
 
             "repository": repo_name, 
 
             "findings": findings, 
 
             "risk_level": risk_level, 
 
             "summary": summary, 
 
             "business_impact": ai_report["business_impact"],

             "recommendations": ai_report["recommendations"],

             "created_at": 
             datetime.utcnow(),

             # Keeping application context
             "user_id": current_user["_id"],
             "repo_url": repo_url,
             "scanned_files": len(files_to_scan),
             "vulnerabilities_found": len(file_results),
             "risk_score": risk_score
         }
        await scan_collection.insert_one(scan_document)

        return { 
 
             "findings": findings, 
 
             "risk_score": risk_score, 
 
             "ai_report": ai_report 
         }

    except BadCredentialsException:
        raise HTTPException(
            status_code=401,
            detail="Invalid GitHub credentials. Please check your token."
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error scanning repository: {str(e)}"
        )


@router.post("/generate-pdf") 
async def generate_pdf( 
    data: dict, 
    current_user: dict = Depends(get_current_user) 
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
        "user_id": current_user["_id"],
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
async def get_scan_history(current_user: dict = Depends(get_current_user)):
    try:
        scan_collection = database["github_scans"]
        
        # Admin sees all, user sees own
        # Also include legacy scans that have no user_id (saved before auth was enforced)
        query = {}
        if current_user.get("role") != "admin":
            query = {
                "$or": [
                    {"user_id": current_user["_id"]},
                    {"user_id": {"$exists": False}},
                    {"user_id": None}
                ]
            }

        scans = await scan_collection.find(query).sort("created_at", -1).to_list(length=100)
        
        # Convert MongoDB _id to string and normalize old field names
        for scan in scans:
            scan["_id"] = str(scan["_id"])
            if "user_id" in scan:
                scan["user_id"] = str(scan["user_id"])
            # Normalize old field names to new ones for backward compatibility
            if "repo_name" in scan and "repository" not in scan:
                scan["repository"] = scan["repo_name"]
            if "findings_count" in scan and "vulnerabilities_found" not in scan:
                scan["vulnerabilities_found"] = scan["findings_count"]
            if "scanned_files" not in scan:
                scan["scanned_files"] = "N/A"
            
        return scans
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):

    reports_collection = database[
        "security_reports"
    ]

    # Admin sees all, user sees own
    query = {}
    if current_user.get("role") != "admin":
        query = {"user_id": current_user["_id"]}

    reports = await reports_collection.find(query).sort(
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

