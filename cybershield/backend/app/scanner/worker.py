"""
Scan Worker — background worker that processes scan jobs from the queue.
"""
import asyncio
from app.scanner.queue import scan_queue
from app.scanner.scan_engine import execute_scan
from app.scanner.state_manager import get_scan_job, update_scan_job
from app.scanner.progress import update_progress, add_log_entry


async def scan_worker():
    """Background worker that pulls jobs from the queue and executes them."""
    while True:
        job = await scan_queue.get()
        try:
            scan_id = job.get("scan_id")
            if not scan_id:
                continue

            # Check if already cancelled before starting
            current = await get_scan_job(scan_id)
            if current and current.get("status") == "cancelled":
                continue

            # Mark as running
            await update_scan_job(scan_id, {"status": "running"})
            await update_progress(scan_id, 0, current_stage="Worker picked up job", status="running")
            await add_log_entry(scan_id, "Scan worker started processing")

            # Execute the scan
            await execute_scan(scan_id)

        except Exception as e:
            # Mark scan as failed
            scan_id = job.get("scan_id", "unknown")
            try:
                await update_scan_job(scan_id, {
                    "status": "failed",
                    "current_stage": f"Failed: {str(e)}",
                })
                await update_progress(scan_id, 0, status="failed", log=f"Error: {str(e)}")
            except Exception:
                pass
        finally:
            scan_queue.task_done()


async def start_worker():
    """Start the background scan worker."""
    # Reset any jobs stuck from a previous server run
    from app.scanner.state_manager import reset_stale_jobs
    await reset_stale_jobs()
    asyncio.create_task(scan_worker())
