"""
Scan Progress Manager
In-memory store for tracking GitHub scan progress in real-time.
"""

from datetime import datetime
from typing import Dict, Any, Optional

# In-memory storage for scan progress
scan_status: Dict[str, Dict[str, Any]] = {}


def create_scan(scan_id: str) -> Dict[str, Any]:
    """
    Initialize a new scan tracking entry.
    
    Args:
        scan_id: Unique identifier for the scan
        
    Returns:
        The created scan status dictionary
    """
    scan_status[scan_id] = {
        "scan_id": scan_id,
        "status": "running",
        "progress": 0,
        "stage": "Initializing",
        "current_file": "",
        "message": "",
        "logs": [],
        "started_at": datetime.utcnow().isoformat(),
        "completed": False
    }
    return scan_status[scan_id]


def update_scan(
    scan_id: str,
    stage: Optional[str] = None,
    progress: Optional[int] = None,
    current_file: Optional[str] = None,
    message: Optional[str] = None
) -> bool:
    """
    Update scan progress with new information.
    
    Args:
        scan_id: Unique identifier for the scan
        stage: Current stage name (e.g., "Static Analysis", "Secret Scanning")
        progress: Progress percentage (0-100)
        current_file: Name of file currently being processed
        message: Status message to log
        
    Returns:
        True if scan was found and updated, False otherwise
    """
    if scan_id not in scan_status:
        return False
    
    data = scan_status[scan_id]
    
    if stage is not None:
        data["stage"] = stage
    
    if progress is not None:
        data["progress"] = progress
    
    if current_file is not None:
        data["current_file"] = current_file
    
    if message:
        data["message"] = message
        data["logs"].append({
            "time": datetime.utcnow().strftime("%H:%M:%S"),
            "message": message
        })
    
    return True


def complete_scan(scan_id: str, success: bool = True) -> bool:
    """
    Mark scan as completed or failed.
    
    Args:
        scan_id: Unique identifier for the scan
        success: Whether the scan completed successfully
        
    Returns:
        True if scan was found and updated, False otherwise
    """
    if scan_id not in scan_status:
        return False
    
    if success:
        scan_status[scan_id]["progress"] = 100
        scan_status[scan_id]["stage"] = "Completed"
        scan_status[scan_id]["status"] = "completed"
    else:
        scan_status[scan_id]["stage"] = "Failed"
        scan_status[scan_id]["status"] = "failed"
    
    scan_status[scan_id]["completed"] = True
    return True


def get_scan(scan_id: str) -> Optional[Dict[str, Any]]:
    """
    Get current scan status.
    
    Args:
        scan_id: Unique identifier for the scan
        
    Returns:
        Scan status dictionary or None if not found
    """
    return scan_status.get(scan_id)


def delete_scan(scan_id: str) -> bool:
    """
    Remove scan from tracking (cleanup).
    
    Args:
        scan_id: Unique identifier for the scan
        
    Returns:
        True if scan was found and deleted, False otherwise
    """
    if scan_id in scan_status:
        del scan_status[scan_id]
        return True
    return False