from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import FileResponse 
from github import Github, GithubException, BadCredentialsException
import concurrent.futures
import time
import requests
import uuid
from datetime import datetime 
from bson import ObjectId
from app.database.db import database 

from app.config.settings import settings
from app.services.github_scanner import ( 
    scan_file_content,
    detect_technology,
    scan_dangerous_code
)
from app.scanner.file_scanner import scan_content_with_snippets
from app.scanner.language_detector import detect_language
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
from app.services.scan_progress import create_scan, get_scan
from app.services.github_scan_runner import run_repository_scan
from app.services.file_reader import fetch_file_content, build_highlights, detect_language as detect_monaco_language
 
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
    """Fetch raw content and scan a single file with E2 enriched findings (line, column, snippet, context)."""
    try:
        raw_url = f"https://raw.githubusercontent.com/{repo_full_name}/{branch}/{file_path}"
        response = requests.get(raw_url, timeout=10)

        if response.status_code != 200:
            return None

        # Skip files larger than 1 MB
        if len(response.content) > 1_000_000:
            return None

        decoded_content = response.text

        # E2: enriched scanner — includes line, column, snippet, context per location
        issues = scan_content_with_snippets(decoded_content, file_path)

        if issues:
            return {
                "file": file_path,
                "language": detect_language(file_path),
                "issues": issues
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
 
    findings = data.get("findings", [])
    files_scanned = data.get("files_scanned", 0)
    risk_score = calculate_risk_score([{"issues": findings}])
 
    return generate_ai_report(findings, files_scanned, risk_score)

@router.post("/scan-repository") 
async def scan_repository(
    data: dict,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
): 
    """
    Start a background scan. Returns immediately with scan_id.
    Frontend should poll GET /scan-progress/{scan_id} for updates.
    """
    repo_url = data.get("repo_url") 

    if not repo_url: 
        raise HTTPException( 
            status_code=400, 
            detail="Repository URL is required" 
        ) 

    # Generate unique scan_id and initialize progress tracking
    scan_id = str(uuid.uuid4())
    create_scan(scan_id)

    # Start background scan
    background_tasks.add_task(
        run_repository_scan,
        scan_id,
        repo_url,
        str(current_user["_id"])
    )

    return {
        "scan_id": scan_id,
        "status": "started"
    }


@router.get("/scan-progress/{scan_id}")
async def scan_progress(scan_id: str):
    """
    Get real-time scan progress.
    Frontend polls this endpoint to track scan status.
    """
    data = get_scan(scan_id)
    
    if not data:
        raise HTTPException(
            status_code=404,
            detail="Scan not found"
        )
    
    return data


@router.get("/scan-results/{scan_id}")
async def scan_results(scan_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get the final scan results once scan is completed.
    Frontend calls this after scan_progress shows completed=true.
    """
    from app.services.scan_progress import get_scan
    
    scan_data = get_scan(scan_id)
    if not scan_data:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    if scan_data["status"] != "completed":
        raise HTTPException(status_code=202, detail="Scan still in progress")
    
    # Fetch the saved results from database
    scan_collection = database["github_scans"]
    scan_doc = await scan_collection.find_one({"scan_id": scan_id})
    
    if not scan_doc:
        raise HTTPException(status_code=404, detail="Scan results not found in database")
    
    # Ensure user owns this scan (or is admin)
    if str(scan_doc.get("user_id")) != str(current_user["_id"]) and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    scan_doc["_id"] = str(scan_doc["_id"])
    if "user_id" in scan_doc:
        scan_doc["user_id"] = str(scan_doc["user_id"])
    
    return scan_doc


@router.get("/file-content")
async def file_content(
    scan_id: str,
    file: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Fetch a file's source code from the scanned repository,
    with vulnerability highlights for the VS Code-style code viewer.

    Query params:
        scan_id – the scan ID returned by /scan-repository
        file    – repo-relative file path, e.g. "app/routes/contributions.js"
    """
    # ── 1. Look up scan ────────────────────────────────────────────────
    scan_doc = await database["github_scans"].find_one({"scan_id": scan_id})
    if not scan_doc:
        raise HTTPException(status_code=404, detail="Scan not found")

    # ── 2. Extract repo info ───────────────────────────────────────────
    repo_info = scan_doc.get("repository_info") or {}
    repo_name = repo_info.get("repository") or scan_doc.get("repository", "")
    branch = repo_info.get("default_branch", "main")

    if not repo_name:
        raise HTTPException(status_code=400, detail="Repository name not found in scan data")

    # ── 3. Fetch file content ──────────────────────────────────────────
    lines = fetch_file_content(repo_name, branch, file)
    if lines is None:
        raise HTTPException(status_code=404, detail="File not found in repository")

    content = [{"line": i + 1, "text": line} for i, line in enumerate(lines)]

    # ── 4. Build highlights from file_report ───────────────────────────
    file_report = scan_doc.get("file_report", [])
    highlights = build_highlights(file_report, file)

    # ── 5. Detect language (Monaco-compatible) ─────────────────────────
    language = detect_monaco_language(file)

    return {
        "file": file,
        "language": language,
        "content": content,
        "highlights": highlights,
    }


@router.get("/ai-fix")
async def ai_fix(
    scan_id: str,
    file: str,
    type: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate an AI-powered fix suggestion for a specific vulnerability.

    Query params:
        scan_id – the scan ID
        file    – repo-relative file path
        type    – vulnerability type, e.g. "Hardcoded API Key"
    """
    from app.ai.gemini_client import generate, is_available

    # ── 1. Look up scan ────────────────────────────────────────────────
    scan_doc = await database["github_scans"].find_one({"scan_id": scan_id})
    if not scan_doc:
        raise HTTPException(status_code=404, detail="Scan not found")

    # ── 2. Extract repo info & fetch file ──────────────────────────────
    repo_info = scan_doc.get("repository_info") or {}
    repo_name = repo_info.get("repository") or scan_doc.get("repository", "")
    branch = repo_info.get("default_branch", "main")

    lines = fetch_file_content(repo_name, branch, file)
    if lines is None:
        raise HTTPException(status_code=404, detail="File not found")

    language = detect_monaco_language(file)
    source_code = "\n".join(lines)

    # ── 3. Find the specific issue details from file_report ────────────
    file_report = scan_doc.get("file_report", [])
    issue_details = {}
    for entry in file_report:
        if entry.get("file") == file:
            for issue in entry.get("issues", []):
                if issue.get("type") == type:
                    issue_details = issue
                    break
            break

    severity = issue_details.get("severity", "Medium")
    snippet = ""
    line_num = issue_details.get("line", 1)
    if issue_details.get("locations"):
        snippet = issue_details["locations"][0].get("snippet", "")
    elif 0 < line_num <= len(lines):
        snippet = lines[line_num - 1]

    # ── 4. Try AI generation, fall back to rule-based ──────────────────
    if is_available():
        prompt = f"""You are a senior security engineer. Analyze this vulnerability and provide a fix.

Issue Type: {type}
Severity: {severity}
File: {file}
Language: {language}
Vulnerable Line: {snippet}

Source Code (surrounding context):
```
{source_code[:3000]}
```

Respond in this exact JSON format (no markdown, no code fences):
{{
  "why": "One sentence explaining why this is dangerous",
  "before": "the exact vulnerable line of code",
  "after": "the fixed line of code",
  "recommendation": "One sentence recommendation",
  "patch": "The unified diff patch (one line removed, one added)",
  "confidence": "95%"
}}"""
        try:
            raw = await generate(prompt)
            import json as _json
            # Strip markdown fences if present
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1]
            if cleaned.endswith("```"):
                cleaned = cleaned.rsplit("```", 1)[0]
            cleaned = cleaned.strip()
            ai_result = _json.loads(cleaned)
            return {
                "issue": type,
                "severity": severity,
                "why": ai_result.get("why", ""),
                "before": ai_result.get("before", snippet),
                "after": ai_result.get("after", ""),
                "recommendation": ai_result.get("recommendation", ""),
                "patch": ai_result.get("patch", ""),
                "confidence": ai_result.get("confidence", "90%"),
            }
        except Exception:
            pass  # Fall through to rule-based

    # ── 5. Rule-based fallback ─────────────────────────────────────────
    FIXES = {
        "Hardcoded API Key": {
            "why": "API keys stored in source code can be leaked through version control history.",
            "recommendation": "Move secrets into environment variables and never commit them to source control.",
            "after": f"process.env.API_KEY /* {type} moved to .env */",
        },
        "Hardcoded Token": {
            "why": "Hardcoded tokens can be extracted by anyone with repository access.",
            "recommendation": "Store tokens in environment variables or a secrets manager.",
            "after": f"process.env.TOKEN /* {type} moved to .env */",
        },
        "Password Variable": {
            "why": "Passwords in source code are visible to all contributors and in Git history.",
            "recommendation": "Use environment variables or a vault service for credentials.",
            "after": f"process.env.PASSWORD /* moved to .env */",
        },
        "AWS Access Key": {
            "why": "AWS keys in code can lead to unauthorized cloud resource access.",
            "recommendation": "Use IAM roles, environment variables, or AWS Secrets Manager.",
            "after": "process.env.AWS_ACCESS_KEY_ID",
        },
        "JWT Secret": {
            "why": "Exposed JWT secrets allow token forgery and authentication bypass.",
            "recommendation": "Store JWT secrets in environment variables.",
            "after": "process.env.JWT_SECRET",
        },
        "MongoDB URI": {
            "why": "Database connection strings contain credentials that can be exploited.",
            "recommendation": "Store database URIs in environment variables.",
            "after": "process.env.MONGODB_URI",
        },
        "JavaScript eval()": {
            "why": "eval() executes arbitrary code and is a critical XSS/injection vector.",
            "recommendation": "Replace eval() with safe alternatives like JSON.parse() or Function constructor.",
            "after": "JSON.parse(safeInput) /* replaced eval() with safe parser */",
        },
        "Python eval()": {
            "why": "eval() in Python executes arbitrary code, leading to remote code execution.",
            "recommendation": "Use ast.literal_eval() or json.loads() instead of eval().",
            "after": "ast.literal_eval(safe_input) /* replaced eval() */",
        },
    }

    fix = FIXES.get(type, {
        "why": f"The '{type}' pattern poses a security risk.",
        "recommendation": "Review and remediate this issue following security best practices.",
        "after": "/* TODO: Apply security fix */",
    })

    before_code = snippet or f"/* {type} detected */"
    after_code = fix["after"]
    patch = f"- {before_code.strip()}\n+ {after_code}"

    return {
        "issue": type,
        "severity": severity,
        "why": fix["why"],
        "before": before_code.strip(),
        "after": after_code,
        "recommendation": fix["recommendation"],
        "patch": patch,
        "confidence": "85%",
    }


# ── Legacy synchronous endpoint (kept for backward compatibility) ──────────
@router.post("/scan-repository-sync") 
async def scan_repository_sync(
    data: dict,
    current_user: dict = Depends(get_current_user)
): 
    """Synchronous scan endpoint (legacy). Prefer /scan-repository with progress tracking."""
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
                raise HTTPException(
                    status_code=429,
                    detail=f"GitHub API rate limit exceeded."
                )
        except HTTPException:
            raise
        except (BadCredentialsException, GithubException) as ge:
            if isinstance(ge, BadCredentialsException) or (hasattr(ge, "status") and ge.status == 401):
                print("WARNING: GitHub token is invalid or expired. Falling back to unauthenticated mode.")
                github_client = Github()
            elif hasattr(ge, "status") and ge.status in [403, 429]:
                raise HTTPException(status_code=429, detail="GitHub API rate limit exceeded.")
            else:
                pass
        except Exception:
            pass

        try:
            repo = github_client.get_repo(repo_name)
        except BadCredentialsException:
            github_client = Github()
            repo = github_client.get_repo(repo_name)
        except GithubException as ge:
            if ge.status == 404:
                raise HTTPException(status_code=404, detail="Repository not found.")
            elif ge.status in [403, 429]:
                raise HTTPException(status_code=429, detail="GitHub API rate limit exceeded.")
            else:
                raise
        
        default_branch = repo.default_branch
        tree = repo.get_git_tree(default_branch, recursive=True)
        all_file_paths = [item.path for item in tree.tree if item.type == "blob"]

        technologies = detect_technologies(all_file_paths, repo_name, default_branch)
        dep_scan = scan_dependencies(all_file_paths, repo_name, default_branch)
        dependency_report = dep_scan["dependency_report"]
        dependency_findings = dep_scan["dependency_findings"]

        files_to_scan = [
            p for p in all_file_paths
            if p.endswith((".py", ".js", ".ts", ".env", ".yml", ".yaml", ".json", ".txt", ".sh")) or
            "config" in p.lower()
        ][:100]

        file_results = []
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
        findings = []
        for f in file_results:
            findings.extend(f["issues"])

        ai_report = generate_ai_report(findings, len(files_to_scan), risk_score)
        risk_level = ai_report["risk_level"]
        summary = ai_report["summary"]

        dep_rpt = dependency_report
        dep_summary = (
            f"Dependency Analysis: {dep_rpt['total_packages']} packages scanned. "
            f"{dep_rpt['outdated']} outdated, "
            f"{dep_rpt['risky']} risky, "
            f"{dep_rpt['unpinned']} packages without pinned versions."
        )
        dep_recommendations = []
        if dep_rpt["outdated"] > 0: dep_recommendations.append("Update outdated dependencies to reduce known vulnerability exposure.")
        if dep_rpt["unpinned"] > 0: dep_recommendations.append("Pin all package versions for reproducible, predictable builds.")
        if dep_rpt["risky"] > 0: dep_recommendations.append("Review and replace risky packages where safer alternatives exist.")
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

        scan_collection = database["github_scans"]
        scan_document = { 
             "repository": repo_name, 
             "findings": findings, 
             "risk_level": risk_level, 
             "summary": summary, 
             "business_impact": ai_report["business_impact"],
             "recommendations": ai_report["recommendations"],
             "dependency_report": dependency_report,
             "created_at": datetime.utcnow(),
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
        raise HTTPException(status_code=401, detail="Invalid GitHub credentials. Please check your token.")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error scanning repository: {str(e)}")


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


@router.get("/history/{repository}")
async def get_repository_history(repository: str, current_user: dict = Depends(get_current_user)):
    """
    Get scan history for a specific repository.
    Returns scans ordered by date (newest first) with summary info for trend display.
    """
    try:
        scan_collection = database["github_scans"]

        query = {"repository": repository}
        if current_user.get("role") != "admin":
            query["$or"] = [
                {"user_id": current_user["_id"]},
                {"user_id": {"$exists": False}},
                {"user_id": None},
            ]

        scans = await scan_collection.find(query).sort("created_at", -1).to_list(length=50)

        result = []
        for scan in scans:
            scan_summary = scan.get("scan_summary", {})
            severity_counts = scan_summary.get("severity_counts", {})
            risk_score = scan.get("risk_score", 0)

            # Compute security grade from risk_score
            if risk_score >= 90:
                grade = "A"
            elif risk_score >= 80:
                grade = "B"
            elif risk_score >= 70:
                grade = "C"
            elif risk_score >= 60:
                grade = "D"
            else:
                grade = "F"

            result.append({
                "scan_id": scan.get("scan_id", str(scan.get("_id", ""))),
                "repository": scan.get("repository", ""),
                "scan_date": scan.get("created_at", ""),
                "risk_level": scan.get("risk_level", "Unknown"),
                "risk_score": risk_score,
                "security_grade": grade,
                "total_findings": scan.get("vulnerabilities_found", len(scan.get("findings", []))),
                "severity_counts": severity_counts,
                "scanned_files": scan.get("scanned_files", 0),
            })

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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

