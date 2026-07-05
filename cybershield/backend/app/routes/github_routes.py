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
from app.services.repository_info import get_repository_info
from app.services.technology_detector import detect_technologies
from app.services.dependency_scanner import scan_dependencies
 
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
        repo_info = get_repository_info(repo_url)
    except ValueError as val_err:
        err_msg = str(val_err)
        if "not found" in err_msg.lower():
            raise HTTPException(status_code=404, detail="Repository not found.")
        elif "rate limit" in err_msg.lower():
            raise HTTPException(status_code=429, detail="GitHub API rate limit exceeded.")
        else:
            raise HTTPException(status_code=400, detail="Invalid GitHub repository URL.")

    repo_name = repo_info["repository"]

    try:
        # Check current rate limit status before starting
        try:
            rate_limit = github_client.get_rate_limit().resources.core
            if rate_limit.remaining < 5:
                reset_time = time.strftime('%H:%M:%S', time.localtime(rate_limit.reset.timestamp()))
                raise HTTPException(
                    status_code=429,
                    detail=f"GitHub API rate limit exceeded."
                )
        except HTTPException:
            raise
        except (BadCredentialsException, GithubException) as ge:
            if isinstance(ge, BadCredentialsException) or (hasattr(ge, "status") and ge.status == 401):
                # Token is invalid/expired — fall back to unauthenticated mode
                print("WARNING: GitHub token is invalid or expired. Falling back to unauthenticated mode (60 req/hr).")
                github_client = Github()
            elif hasattr(ge, "status") and ge.status in [403, 429]:
                raise HTTPException(
                    status_code=429,
                    detail="GitHub API rate limit exceeded."
                )
            else:
                pass
        except Exception:
            pass

        # Try with current client; if credentials fail, retry without token
        try:
            repo = github_client.get_repo(repo_name)
        except BadCredentialsException:
            print("WARNING: GitHub token rejected on get_repo. Retrying without token.")
            github_client = Github()
            repo = github_client.get_repo(repo_name)
        except GithubException as ge:
            if ge.status == 404:
                raise HTTPException(status_code=404, detail="Repository not found.")
            elif ge.status in [403, 429]:
                raise HTTPException(status_code=429, detail="GitHub API rate limit exceeded.")
            else:
                raise
        
        # Get all files using git tree to be more efficient
        default_branch = repo.default_branch
        tree = repo.get_git_tree(default_branch, recursive=True)
        all_file_paths = [item.path for item in tree.tree if item.type == "blob"]

        # ── Technology Detection (runs before security scan) ─────────────────
        technologies = detect_technologies(all_file_paths, repo_name, default_branch)

        # ── Dependency Scan ────────────────────────────────────────
        dep_scan = scan_dependencies(all_file_paths, repo_name, default_branch)
        dependency_report   = dep_scan["dependency_report"]
        dependency_findings = dep_scan["dependency_findings"]

        # Filter files eligible for security scanning
        files_to_scan = [
            p for p in all_file_paths
            if p.endswith((".py", ".js", ".ts", ".env", ".yml", ".yaml", ".json", ".txt", ".sh")) or
            "config" in p.lower()
        ]

        # Limit to 100 files to avoid timeouts
        files_to_scan = files_to_scan[:100]

        file_results = []

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

        risk_score = calculate_risk_score(file_results)
        
        # Extract all issues for threat analysis
        findings = []
        for f in file_results:
            findings.extend(f["issues"])

        # Generate threat analysis
        ai_report = generate_ai_report(findings, len(files_to_scan), risk_score)
        risk_level = ai_report["risk_level"]
        summary = ai_report["summary"]

        # ── Enhance AI report with dependency insights ──────────────────
        dep_rpt = dependency_report
        dep_summary = (
            f"Dependency Analysis: {dep_rpt['total_packages']} packages scanned. "
            f"{dep_rpt['outdated']} outdated, "
            f"{dep_rpt['risky']} risky, "
            f"{dep_rpt['unpinned']} packages without pinned versions."
        )
        dep_recommendations = []
        if dep_rpt["outdated"]  > 0: dep_recommendations.append("Update outdated dependencies to reduce known vulnerability exposure.")
        if dep_rpt["unpinned"]  > 0: dep_recommendations.append("Pin all package versions for reproducible, predictable builds.")
        if dep_rpt["risky"]     > 0: dep_recommendations.append("Review and replace risky packages where safer alternatives exist.")
        ai_report["dependency_analysis"] = dep_summary
        ai_report["recommendations"] = dep_recommendations + (ai_report.get("recommendations") or [])

        report_data = {
            "repository": repo_name,
            "findings": file_results,
            "technologies": technologies,
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

             "dependency_report": dependency_report,

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
             "repository_info": repo_info,
             "technologies": technologies,
             "dependency_report": dependency_report,
             "dependency_findings": dependency_findings,
             "scan_summary": report,
             "findings": findings, 
             "file_report": file_results, 
             "ai_report": ai_report 
         }

    except HTTPException:
        raise
    except BadCredentialsException:
        raise HTTPException(
            status_code=401,
            detail="Invalid GitHub credentials. Please check your token."
        )
    except Exception as e:
        import traceback
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

