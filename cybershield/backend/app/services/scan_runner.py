"""
Reusable GitHub security scan pipeline (Module 6.5).

Extracted from github_routes.scan_repository so it can be called both from
the HTTP endpoint and from the background scheduler. Performs a real scan,
persists the result and returns a normalized summary.

Supports optional scan_progress integration for real-time progress tracking.
"""
import concurrent.futures
import time
import traceback
from datetime import datetime
from typing import Dict, Any, Optional

from github import Github, GithubException, BadCredentialsException

from app.config.settings import settings
from app.database.db import database
from app.services.github_scanner import scan_file_content, detect_technology, scan_dangerous_code
from app.services.vulnerability_locator import scan_file_content as locate_findings, deduplicate_findings
from app.services.security_patterns import SECURITY_PATTERNS
from app.services.vulnerability_intelligence import get_vulnerability_info
from app.services.report_generator import generate_security_report
from app.services.risk_engine import calculate_risk_score, generate_risk_dashboard
from app.services.threat_analyzer import (
    generate_summary, generate_ai_report, calculate_risk_level,
)
from app.services.repository_info import get_repository_info
from app.services.technology_detector import detect_technologies
from app.services.dependency_scanner import scan_dependencies
from app.services.scan_progress import update_scan, complete_scan
from app.services.history_service import save_scan

github_client = Github(settings.GITHUB_TOKEN) if settings.GITHUB_TOKEN else Github()

# File extension → language mapping
_EXT_LANG = {
    ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript", ".tsx": "TypeScript",
    ".jsx": "JavaScript", ".java": "Java", ".go": "Go", ".rs": "Rust",
    ".rb": "Ruby", ".php": "PHP", ".c": "C", ".cpp": "C++", ".cs": "C#",
    ".h": "C/C++", ".hpp": "C++", ".swift": "Swift", ".kt": "Kotlin",
    ".scala": "Scala", ".sh": "Shell", ".bash": "Shell", ".zsh": "Shell",
    ".ps1": "PowerShell", ".yml": "YAML", ".yaml": "YAML", ".json": "JSON",
    ".xml": "XML", ".html": "HTML", ".css": "CSS", ".scss": "SCSS",
    ".sql": "SQL", ".md": "Markdown", ".dockerfile": "Docker",
    ".tf": "Terraform", ".gradle": "Groovy", ".makefile": "Makefile",
    ".r": "R", ".m": "Objective-C", ".vue": "Vue", ".svelte": "Svelte",
}


def _detect_language(file_path: str) -> str:
    """Detect language from file extension."""
    if not file_path:
        return ""
    lower = file_path.lower()
    for ext, lang in _EXT_LANG.items():
        if lower.endswith(ext):
            return lang
    if "dockerfile" in lower:
        return "Docker"
    if "makefile" in lower:
        return "Makefile"
    return ""


def _scan_single_file(repo_full_name, branch, file_path):
    """Fetch raw content and scan a single file."""
    import requests
    try:
        raw_url = f"https://raw.githubusercontent.com/{repo_full_name}/{branch}/{file_path}"
        response = requests.get(raw_url, timeout=10)
        if response.status_code != 200:
            return None
        if len(response.content) > 1_000_000:
            return None
        decoded_content = response.text
        secret_findings = scan_file_content(decoded_content)
        code_findings = scan_dangerous_code(decoded_content, file_path)
        result = secret_findings + code_findings
        if result:
            return {"file": file_path, "issues": result, "raw_content": decoded_content}
    except Exception:
        pass
    return None


async def run_github_scan(repo_url: str, user_id: Optional[str] = None,
                          project_id: Optional[str] = None,
                          scan_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Run a full GitHub scan and store the result.

    Args:
        repo_url: GitHub repository URL
        user_id: ID of the user who initiated the scan
        project_id: Optional project ID
        scan_id: Optional scan_id for progress tracking (from github_scan_runner)

    Returns a normalized summary:
      {
        "repository": str,
        "risk_score": int,
        "risk_level": str,
        "vulnerabilities_found": int,
        "critical_count": int,
        "scanned_files": int,
        "scan_id": str,
        "compliance_score": Optional[int],
      }
    Raises ValueError on bad repo / rate limit.
    """
    global github_client

    if not repo_url:
        raise ValueError("Repository URL is required")

    # Progress: Fetching repository info
    if scan_id:
        update_scan(scan_id, stage="Initializing", progress=8, message="Fetching repository information")

    try:
        repo_info = get_repository_info(repo_url)
    except ValueError as e:
        msg = str(e)
        if "not found" in msg.lower():
            raise ValueError("Repository not found.")
        if "rate limit" in msg.lower():
            raise ValueError("GitHub API rate limit exceeded.")
        raise ValueError("Invalid GitHub repository URL.")

    repo_name = repo_info["repository"]

    # Progress: Connecting to GitHub
    if scan_id:
        update_scan(scan_id, stage="Downloading Repository", progress=15, message=f"Connecting to {repo_name}")

    try:
        rate_limit = github_client.get_rate_limit().resources.core
        if rate_limit.remaining < 5:
            raise ValueError("GitHub API rate limit exceeded.")
    except (BadCredentialsException, GithubException):
        github_client = Github()
    except ValueError:
        raise
    except Exception:
        pass

    # Progress: Getting repository tree
    if scan_id:
        update_scan(scan_id, stage="Downloading Repository", progress=20, message="Fetching file tree")

    try:
        repo = github_client.get_repo(repo_name)
    except BadCredentialsException:
        github_client = Github()
        repo = github_client.get_repo(repo_name)
    except GithubException as ge:
        if ge.status == 404:
            raise ValueError("Repository not found.")
        if ge.status in (403, 429):
            raise ValueError("GitHub API rate limit exceeded.")
        raise

    default_branch = repo.default_branch
    tree = repo.get_git_tree(default_branch, recursive=True)
    all_file_paths = [item.path for item in tree.tree if item.type == "blob"]

    # Progress: Technology Detection
    if scan_id:
        update_scan(scan_id, stage="Technology Detection", progress=25, message="Detecting technologies")

    technologies = detect_technologies(all_file_paths, repo_name, default_branch)

    # Progress: Dependency Scan
    if scan_id:
        update_scan(scan_id, stage="Dependency Analysis", progress=35, message="Scanning dependencies")

    dep_scan = scan_dependencies(all_file_paths, repo_name, default_branch)
    dependency_report = dep_scan["dependency_report"]
    dependency_findings = dep_scan["dependency_findings"]

    files_to_scan = [
        p for p in all_file_paths
        if p.endswith((".py", ".js", ".ts", ".env", ".yml", ".yaml", ".json", ".txt", ".sh"))
        or "config" in p.lower()
    ]

    # Progress: Static Analysis
    if scan_id:
        update_scan(scan_id, stage="Static Analysis", progress=50, message=f"Scanning {len(files_to_scan)} files")

    file_results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(_scan_single_file, repo_name, default_branch, f): f
            for f in files_to_scan
        }
        for future in concurrent.futures.as_completed(futures):
            res = future.result()
            if res:
                file_results.append(res)

    # Progress: Risk Assessment
    if scan_id:
        update_scan(scan_id, stage="Risk Assessment", progress=75, message="Calculating risk score")

    risk_score = calculate_risk_score(file_results)
    findings = []
    for f in file_results:
        file_path = f.get("file", "")
        lang = _detect_language(file_path)
        for issue in f.get("issues", []):
            issue["file"] = file_path
            issue.setdefault("language", lang)
            issue.setdefault("line", 1)
            issue.setdefault("column", issue.get("column_start", 1))
            issue.setdefault("message", f"{issue.get('type', 'Issue')} detected in {file_path}")
            issue.setdefault("recommendation", "Review and remediate this issue")
            findings.append(issue)

    # H6.2: Supplement with pattern-based locator for additional coverage
    for f in file_results:
        file_path = f.get("file", "")
        raw_content = f.get("raw_content", "")
        if raw_content:
            extra = locate_findings(file_path, raw_content, SECURITY_PATTERNS)
            findings.extend(extra)

    # H6.2: Deduplicate findings by (file, line, type)
    findings = deduplicate_findings(findings)

    # H6.3: Enrich each finding with vulnerability intelligence metadata
    for finding in findings:
        finding["intelligence"] = get_vulnerability_info(finding.get("type", ""))

    # H6.5: Generate risk dashboard with per-finding scores and priority queue
    risk_dashboard = generate_risk_dashboard(findings)

    # Progress: AI Analysis
    if scan_id:
        update_scan(scan_id, stage="AI Remediation", progress=85, message="Generating AI report")

    ai_report = generate_ai_report(findings, len(files_to_scan), risk_score)
    risk_level = ai_report["risk_level"]
    summary = ai_report["summary"]

    dep_rpt = dependency_report
    dep_summary = (
        f"Dependency Analysis: {dep_rpt['total_packages']} packages scanned. "
        f"{dep_rpt['outdated']} outdated, {dep_rpt['risky']} risky, "
        f"{dep_rpt['unpinned']} packages without pinned versions."
    )
    dep_recommendations = []
    if dep_rpt["outdated"] > 0:
        dep_recommendations.append("Update outdated dependencies to reduce known vulnerability exposure.")
    if dep_rpt["unpinned"] > 0:
        dep_recommendations.append("Pin all package versions for reproducible, predictable builds.")
    if dep_rpt["risky"] > 0:
        dep_recommendations.append("Review and replace risky packages where safer alternatives exist.")
    ai_report["dependency_analysis"] = dep_summary
    ai_report["recommendations"] = dep_recommendations + (ai_report.get("recommendations") or [])

    # Progress: Generate Report
    if scan_id:
        update_scan(scan_id, stage="Generating Report", progress=90, message="Generating final report")

    report_data = {
        "repository": repo_name,
        "findings": file_results,
        "technologies": technologies,
        "risk_score": risk_score,
        "summary": summary,
        "risk_level": risk_level,
        "ai_report": ai_report,
    }
    report = generate_security_report(report_data)

    # Progress: Save Results
    if scan_id:
        update_scan(scan_id, stage="Saving Results", progress=95, message="Saving scan results")

    scan_document = {
        "scan_id": scan_id,
        "repository": repo_name,
        "repository_info": repo_info,
        "technologies": technologies,
        "findings": findings,
        "file_report": file_results,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "summary": summary,
        "scan_summary": report,
        "business_impact": ai_report.get("business_impact"),
        "recommendations": ai_report.get("recommendations"),
        "ai_report": ai_report,
        "dependency_report": dependency_report,
        "dependency_findings": dependency_findings,
        "risk_dashboard": risk_dashboard,
        "created_at": datetime.utcnow(),
        "user_id": str(user_id) if user_id else None,
        "project_id": str(project_id) if project_id else None,
        "repo_url": repo_url,
        "scanned_files": len(files_to_scan),
        "vulnerabilities_found": len(file_results),
    }
    res = await database["github_scans"].insert_one(scan_document)
    db_scan_id = str(res.inserted_id)

    # Critical count for automation rules
    critical_count = sum(
        1 for v in findings
        if isinstance(v, dict) and str(v.get("severity", "")).lower() in ("critical", "high")
    )

    # Complete scan progress
    if scan_id:
        update_scan(scan_id, stage="Completed", progress=100, message="Scan completed successfully")
        complete_scan(scan_id, success=True)

    # H7.1: Save scan to history collection for permanent storage
    try:
        final_result = {
            "scan_id": scan_id,
            "repository_info": repo_info,
            "technologies": technologies,
            "findings": findings,
            "file_report": file_results,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "summary": summary,
            "scan_summary": report,
            "business_impact": ai_report.get("business_impact"),
            "recommendations": ai_report.get("recommendations"),
            "ai_report": ai_report,
            "dependency_report": dependency_report,
            "dependency_findings": dependency_findings,
            "risk_dashboard": risk_dashboard,
            "created_at": datetime.utcnow(),
            "user_id": str(user_id) if user_id else None,
            "project_id": str(project_id) if project_id else None,
            "repo_url": repo_url,
            "scanned_files": len(files_to_scan),
            "vulnerabilities_found": len(file_results),
        }
        final_result["scan_id"] = scan_id
        await save_scan(final_result)
    except Exception as e:
        print(f"[ScanRunner] Warning: Failed to save scan to history: {e}")

    return {
        "scan_id": db_scan_id,
        "repository": repo_name,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "vulnerabilities_found": len(file_results),
        "critical_count": critical_count,
        "scanned_files": len(files_to_scan),
        "compliance_score": None,
        "project_id": project_id,
    }
