"""
Scan Queue — async queue for background scan jobs.
"""
import asyncio

# Global scan queue
scan_queue: asyncio.Queue = asyncio.Queue()


async def enqueue_scan(job: dict):
    """Add a scan job to the queue."""
    await scan_queue.put(job)


async def get_queue_size() -> int:
    """Return current queue depth."""
    return scan_queue.qsize()
