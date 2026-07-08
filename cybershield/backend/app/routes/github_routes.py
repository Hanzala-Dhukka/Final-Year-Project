from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse 
from github import Github, GithubException, BadCredentialsException
import concurrent.futures
import time
import requests
from datetime import datetime, timezone
from bson import ObjectId

from app.config.settings import settings
from app.repositories.github_repository import github_scan_repository
from app.repositories.security_report_repository import security_report_repository
from app.services.github_scanner import ( 
    scan_file_content,
    detect_technology,
    scan_dangerous_code
) 
from app.services.secret_scanner import (
    scan_secrets,
    aggregate_secret_findings
)
from app.services.report_generator import ( 
    generate_security_report 
) 
from app.services.pdf_generator import ( 
    generate_pdf_report,
    calculate_risk_score
) 
from app.services.risk_engine import ( 
    calculate_risk 
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
        
        # Old-style secret/code findings (keeping for backward compatibility)
        secret_findings = scan_file_content(
            decoded_content
        )

        code_findings = scan_dangerous_code(
            decoded_content
        )

        # New-style advanced secret findings
        advanced_secret_findings = scan_secrets(decoded_content, file_path)

        result = (
            secret_findings +
            code_findings
        )
        
        return { 
            "file": file_path, 
            "issues": result,
            "advanced_secrets": advanced_secret_findings
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
        all_advanced_secrets = []

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
                    # Collect all advanced secrets
                    if result.get("advanced_secrets"):
                        all_advanced_secrets.extend(result["advanced_secrets"])

        # Extract all issues for threat analysis
        findings = []
        for f in file_results:
            findings.extend(f["issues"])
        
        # Aggregate advanced secret findings
        secret_aggregation = aggregate_secret_findings(all_advanced_secrets)

        # Generate threat analysis
        ai_report = generate_ai_report(findings, len(files_to_scan), 0)
        
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

        # ── Calculate complete risk dashboard ───────────────────────────────
        risk_data = calculate_risk(
            findings=file_results,
            dependency_report=dependency_report,
            secret_summary=secret_aggregation["secret_summary"],
            repository_info=repo_info,
            technologies=technologies,
            file_report=file_results,
            advanced_secrets=all_advanced_secrets,
            dependency_findings=dependency_findings,
            ai_report=ai_report,
            files_scanned=len(files_to_scan)
        )

        report_data = {
            "repository": repo_name,
            "findings": file_results,
            "technologies": technologies,
            "risk_score": risk_data["risk_dashboard"]["risk_score"],
            "summary": ai_report.get("summary", ""),
            "risk_level": risk_data["risk_dashboard"]["risk_level"],
            "ai_report": ai_report
        }
        report = generate_security_report(report_data)

        # Save scan to database using repository
        scan_document = { 
             "repository": repo_name, 
             "findings": findings, 
             "advanced_secrets": all_advanced_secrets,
             "secret_summary": secret_aggregation["secret_summary"],
             "risk_level": risk_data["risk_dashboard"]["risk_level"], 
             "summary": ai_report.get("summary", ""), 
             "business_impact": ai_report["business_impact"],
             "recommendations": risk_data["recommendations"],
             "dependency_report": dependency_report,
             "risk_dashboard": risk_data["risk_dashboard"],
             "severity_summary": risk_data["severity_summary"],
             "category_summary": risk_data["category_summary"],
             "distribution": risk_data["distribution"],
             "repository_health": risk_data["repository_health"],
             "top_risks": risk_data["top_risks"],
             "score_card": risk_data["score_card"],
             "executive_summary": risk_data["executive_summary"],
             "user_id": str(current_user["_id"]),
             "repo_url": repo_url,
             "scanned_files": len(files_to_scan),
             "vulnerabilities_found": len(file_results),
             "risk_score": risk_data["risk_dashboard"]["risk_score"]
         }
        github_scan_repository.create_scan(scan_document)

        return { 
             "repository_info": repo_info,
             "technologies": technologies,
             "dependency_report": dependency_report,
             "dependency_findings": dependency_findings,
             "scan_summary": report,
             "findings": findings, 
             "file_report": file_results, 
             "ai_report": ai_report,
             "secret_summary": secret_aggregation["secret_summary"],
             "advanced_secrets": secret_aggregation["detailed_findings"],
             "risk_dashboard": risk_data["risk_dashboard"],
             "severity_summary": risk_data["severity_summary"],
             "category_summary": risk_data["category_summary"],
             "distribution": risk_data["distribution"],
             "repository_health": risk_data["repository_health"],
             "top_risks": risk_data["top_risks"],
             "recommendations": risk_data["recommendations"],
             "score_card": risk_data["score_card"],
             "executive_summary": risk_data["executive_summary"]
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
 
    # Save to database using repository
    report_document = {
        "user_id": str(current_user["_id"]),
        "report_data": report,
        "title": title,
        "risk_level": report.get("risk_level", "Unknown"),
        "summary": report.get("summary", ""),
        "report_type": "github_scan"
    }
    
    security_report_repository.create_report(report_document)

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
        # Use repository to get scans
        scans = github_scan_repository.get_user_scans(str(current_user["_id"]))
        
        # Normalize old field names to new ones for backward compatibility
        for scan in scans:
            if "scanned_files" not in scan:
                scan["scanned_files"] = "N/A"
            if "advanced_secrets" not in scan:
                scan["advanced_secrets"] = []
            if "secret_summary" not in scan:
                scan["secret_summary"] = {"critical": 0, "high": 0, "medium": 0, "total": 0}
            if "risk_dashboard" not in scan:
                scan["risk_dashboard"] = {
                    "risk_score": 0,
                    "risk_level": "Unknown",
                    "security_grade": "N/A",
                    "files_scanned": 0
                }
            if "severity_summary" not in scan:
                scan["severity_summary"] = {"critical": 0, "high": 0, "medium": 0, "low": 0}
            if "category_summary" not in scan:
                scan["category_summary"] = {"Secrets": 0, "Dependencies": 0, "Code Vulnerabilities": 0, "Configuration": 0}
            if "repository_health" not in scan:
                scan["repository_health"] = {
                    "overall": "Good",
                    "maintainability": "Good",
                    "security": "Good",
                    "dependency_health": "Good",
                    "secret_management": "Good"
                }
            if "top_risks" not in scan:
                scan["top_risks"] = []
            if "score_card" not in scan:
                scan["score_card"] = {
                    "Secrets": "100/100",
                    "Dependencies": "100/100",
                    "Source Code": "100/100",
                    "Configuration": "100/100"
                }
            if "executive_summary" not in scan:
                scan["executive_summary"] = "Scan completed."
            
        return scans
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):
    try:
        # Use repository to get reports
        reports = security_report_repository.get_user_reports(str(current_user["_id"]))
        return reports
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

