"""
Scan Engine — core scanning logic with parallel file processing.
"""
import asyncio
import time
import requests
from app.services.github_scanner import scan_file_content, scan_dangerous_code
from app.services.risk_engine import calculate_risk_score
from app.services.threat_analyzer import generate_ai_report
from app.services.report_generator import generate_security_report
from app.scanner.state_manager import get_scan_job, update_scan_job
from app.scanner.progress import update_progress, add_timeline_event, add_log_entry
from app.services.error_log_service import fire_and_forget_log

# Directories to skip during scanning
IGNORE_DIRS = {
    ".git", "node_modules", "venv", ".venv", "__pycache__",
    "dist", "build", ".next", "coverage", ".tox", "vendor",
    "target", ".gradle", ".maven", "egg-info",
}

# Max files to scan in one batch
BATCH_SIZE = 200

# Concurrency limit for parallel scanning
MAX_CONCURRENT = 8
semaphore = asyncio.Semaphore(MAX_CONCURRENT)


def should_ignore_file(file_path: str) -> bool:
    """Check if a file should be ignored based on directory rules."""
    parts = file_path.split("/")
    for part in parts[:-1]:
        if part in IGNORE_DIRS:
            return True
    return False


def compute_eta(files_completed: int, files_total: int, elapsed: float) -> str:
    """Calculate estimated time remaining."""
    if files_completed == 0 or elapsed == 0:
        return "Calculating..."
    speed = files_completed / elapsed
    remaining = files_total - files_completed
    eta_seconds = remaining / speed
    if eta_seconds < 60:
        return f"{int(eta_seconds)}s"
    minutes = int(eta_seconds // 60)
    seconds = int(eta_seconds % 60)
    return f"{minutes}m {seconds}s"


async def scan_single_file(file_path: str, repo_name: str, branch: str) -> dict | None:
    """Scan a single file for vulnerabilities."""
    async with semaphore:
        try:
            raw_url = f"https://raw.githubusercontent.com/{repo_name}/{branch}/{file_path}"
            response = await asyncio.get_event_loop().run_in_executor(
                None, lambda: requests.get(raw_url, timeout=10)
            )
            if response.status_code != 200:
                return None
            if len(response.content) > 1_000_000:
                return None

            content = response.text
            findings = scan_file_content(content) + scan_dangerous_code(content, file_path)
            if findings:
                return {"file": file_path, "issues": findings}
        except Exception:
            fire_and_forget_log()
            pass
        return None


async def execute_scan(scan_id: str):
    """
    Execute a full security scan on the given job.
    Processes files in parallel with concurrency limits.
    """
    job = await get_scan_job(scan_id)
    if not job:
        return

    files = job.get("files", [])
    repo_name = job.get("repository", "")
    branch = job.get("branch", "main")

    # Filter out ignored files
    files = [f for f in files if not should_ignore_file(f)]

    total = len(files)
    start_time = time.time()

    # ── Stage 1: Initialize ──────────────────────────────────────
    await update_progress(scan_id, 0, current_stage="Initializing scan...", status="running")
    await add_timeline_event(scan_id, "Scan started", "active")
    await add_log_entry(scan_id, f"Starting scan of {repo_name} ({total} files)")

    # ── Stage 2: Scan files in batches ───────────────────────────
    all_results = []
    completed = 0
    batch_start = 0

    while batch_start < total:
        # Check if scan was cancelled
        job = await get_scan_job(scan_id)
        if job and job.get("status") == "cancelled":
            await add_log_entry(scan_id, "Scan cancelled by user")
            await add_timeline_event(scan_id, "Scan cancelled", "cancelled")
            return

        batch = files[batch_start:batch_start + BATCH_SIZE]
        batch_end = min(batch_start + BATCH_SIZE, total)

        tasks = [scan_single_file(f, repo_name, branch) for f in batch]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for r in results:
            if isinstance(r, dict):
                all_results.append(r)
            completed += 1

        # Calculate progress
        pct = int((completed / total) * 100)
        current_file = files[min(completed, total - 1)] if total > 0 else ""
        elapsed = time.time() - start_time
        eta = compute_eta(completed, total, elapsed)

        # Determine current stage
        if pct < 30:
            stage = "Scanning files..."
        elif pct < 60:
            stage = "Analyzing code patterns..."
        elif pct < 85:
            stage = "Deep security analysis..."
        else:
            stage = "Finalizing results..."

        await update_progress(
            scan_id,
            pct,
            current_file=current_file,
            current_stage=stage,
            files_completed=completed,
            files_total=total,
            eta=eta,
            log=f"Scanned: {current_file}",
        )

        batch_start = batch_end

    # ── Stage 3: Generate report ─────────────────────────────────
    await update_progress(scan_id, 90, current_stage="Generating AI report...", log="Building security report")
    await add_timeline_event(scan_id, "Security analysis complete", "completed")

    risk_score = calculate_risk_score(all_results)
    findings = []
    for f in all_results:
        findings.extend(f["issues"])

    ai_report = generate_ai_report(findings, total, risk_score)
    report_data = {
        "repository": repo_name,
        "findings": all_results,
        "risk_score": risk_score,
        "summary": ai_report.get("summary", ""),
        "risk_level": ai_report.get("risk_level", "Unknown"),
        "ai_report": ai_report,
    }
    report = generate_security_report(report_data)

    # ── Module D6: Precise Code Location Engine ──────────────────────────────────
    try:
        from app.scanner.engine.scanner import scan_repository_files as sast_scan
        from app.github.utils import extract_repo_name

        sast_result = await sast_scan(
            scan_id=scan_id,
            repo_url=job.get("repo_url", ""),
            files=job.get("files", []),
            branch=job.get("branch", "main"),
        )
        # Merge D6 findings count into summary
        if sast_result:
            d6_summary = sast_result.get("summary", {})
            report["sast_findings"] = sast_result.get("total_findings", 0)
            report["sast_summary"] = d6_summary
    except Exception as e:
        fire_and_forget_log()
        print(f"[D6 SAST] Error: {e}")

    # ── Stage 4: Complete ────────────────────────────────────────
    await update_scan_job(scan_id, {
        "status": "completed",
        "progress": 100,
        "current_stage": "Scan complete",
        "files_completed": total,
        "vulnerabilities": findings,
        "risk_score": risk_score,
        "report": report,
        "ai_report": ai_report,
    })

    await update_progress(
        scan_id, 100,
        current_stage="Scan complete!",
        files_completed=total,
        files_total=total,
        eta="0s",
        status="completed",
        log=f"Scan complete. {len(findings)} issues found. Risk score: {risk_score}",
    )
    await add_timeline_event(scan_id, "Scan completed", "completed")
    await add_log_entry(scan_id, f"Scan finished in {int(time.time() - start_time)}s — {len(findings)} issues, risk {risk_score}")
