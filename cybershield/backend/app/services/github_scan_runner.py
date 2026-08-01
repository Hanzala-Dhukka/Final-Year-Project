"""
Background GitHub Repository Scan Runner
Wraps the existing scan_runner with progress updates.
"""
import traceback

from app.services.scan_progress import (
    update_scan,
    complete_scan,
)


async def run_repository_scan(scan_id: str, repo_url: str, user_id: str):
    """
    Background task: run scan via scan_runner.run_github_scan with progress hooks.
    """
    try:
        print(f"[ScanRunner] Starting scan {scan_id} for {repo_url}")

        # Import here to avoid circular imports at module level
        from app.services.scan_runner import run_github_scan

        # Stage 1: Initializing
        update_scan(scan_id, stage="Initializing", progress=5, message="Initializing scan")

        # Stage 2: Accessing Repository
        update_scan(scan_id, stage="Downloading Repository", progress=10, message="Accessing GitHub repository")

        # Run the full scan (this calls update_scan internally at each stage)
        result = await run_github_scan(
            repo_url=repo_url,
            user_id=user_id,
            scan_id=scan_id,
        )

        print(f"[ScanRunner] Scan {scan_id} completed. Score: {result.get('risk_score')}")

    except Exception as e:
        error_msg = str(e)
        traceback.print_exc()
        print(f"[ScanRunner] Scan {scan_id} failed: {error_msg}")
        update_scan(scan_id, stage="Failed", progress=0, message=f"Scan failed: {error_msg}")
        complete_scan(scan_id, success=False)
