from fastapi import APIRouter, HTTPException, status, Depends, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
import json
from datetime import datetime
from bson import ObjectId

from app.models.scan_model import ScanModel, VulnerabilityModel
from app.repositories.scan_repository import scan_repository
from app.dependencies.auth import get_current_user
from app.services.gemini_service import generate_ai_response

router = APIRouter(prefix="/security-scan", tags=["security-scan"])

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, scan_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[scan_id] = websocket

    def disconnect(self, scan_id: str):
        if scan_id in self.active_connections:
            del self.active_connections[scan_id]

    async def send_progress(self, scan_id: str, data: Dict[str, Any]):
        if scan_id in self.active_connections:
            try:
                await self.active_connections[scan_id].send_json(data)
            except Exception:
                pass

manager = ConnectionManager()

@router.post("/start")
async def start_scan(
    request: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Start a new security scan"""
    try:
        repo_url = request.get("repo_url")
        if not repo_url:
            raise HTTPException(status_code=400, detail="repo_url is required")

        # Create scan record
        scan_data = {
            "user_id": current_user["_id"],
            "repo_url": repo_url,
            "branch": "main",
            "status": "queued",
            "created_at": datetime.utcnow()
        }
        
        scan_id = await scan_repository.create_scan(scan_data)
        
        # Create initial progress
        progress_data = {
            "scan_id": scan_id,
            "status": "queued",
            "files_processed": 0,
            "total_files": 0,
            "percentage": 0,
            "current_stage": "Queued",
            "updated_at": datetime.utcnow()
        }
        await scan_repository.create_or_update_progress(progress_data)
        
        # Start background scan task
        from app.main import background_tasks
        background_tasks.add_task(run_security_scan, scan_id, repo_url)
        
        return {
            "scan_id": scan_id,
            "status": "queued",
            "message": "Scan started successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start scan: {str(e)}")

@router.get("/{scan_id}/status")
async def get_scan_status(
    scan_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get scan status and progress"""
    scan = await scan_repository.get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    if scan["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    progress = await scan_repository.get_progress(scan_id)
    
    return {
        "scan": scan,
        "progress": progress
    }

@router.get("/{scan_id}/results")
async def get_scan_results(
    scan_id: str,
    severity: str = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get scan results with optional severity filter"""
    scan = await scan_repository.get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    if scan["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if severity:
        vulnerabilities = await scan_repository.get_vulnerabilities_by_severity(scan_id, severity)
    else:
        vulnerabilities = await scan_repository.get_vulnerabilities_by_scan(scan_id)
    
    return {
        "scan": scan,
        "vulnerabilities": vulnerabilities,
        "total": len(vulnerabilities)
    }

@router.get("/search")
async def search_vulnerabilities(
    scan_id: str,
    q: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Search vulnerabilities"""
    scan = await scan_repository.get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    if scan["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    results = await scan_repository.search_vulnerabilities(scan_id, q)
    return {
        "query": q,
        "results": results,
        "count": len(results)
    }

@router.get("/report/{scan_id}/json")
async def get_json_report(
    scan_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Export scan report as JSON"""
    scan = await scan_repository.get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    if scan["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    vulnerabilities = await scan_repository.get_vulnerabilities_by_scan(scan_id)
    
    report = {
        "repository": scan["repo_url"],
        "risk_score": scan["risk_score"],
        "files_scanned": scan["files_scanned"],
        "total_vulnerabilities": scan["total_vulnerabilities"],
        "scan_date": scan["created_at"],
        "vulnerabilities": vulnerabilities
    }
    
    return report

@router.post("/compare")
async def compare_scans(
    request: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Compare two scans"""
    old_scan_id = request.get("old_scan")
    new_scan_id = request.get("new_scan")
    
    if not old_scan_id or not new_scan_id:
        raise HTTPException(status_code=400, detail="Both old_scan and new_scan IDs are required")
    
    comparison = await scan_repository.compare_scans(old_scan_id, new_scan_id)
    if not comparison:
        raise HTTPException(status_code=404, detail="One or both scans not found")
    
    return comparison

@router.post("/remediation")
async def get_ai_remediation(
    request: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get AI-powered remediation suggestions"""
    vulnerability = request.get("vulnerability")
    code_context = request.get("code_context", "")
    language = request.get("language", "python")
    
    if not vulnerability:
        raise HTTPException(status_code=400, detail="vulnerability data is required")
    
    try:
        prompt = f"""
        Security Issue: {vulnerability.get('type', 'Unknown')}
        Severity: {vulnerability.get('severity', 'Unknown')}
        Evidence: {vulnerability.get('evidence', 'N/A')}
        Impact: {vulnerability.get('impact', 'N/A')}
        Language: {language}
        
        Code Context:
        {code_context}
        
        Provide a JSON response with:
        {{
            "solution": "brief solution description",
            "example": "secure code example",
            "best_practice": "security best practice recommendation"
        }}
        """
        
        response = await generate_ai_response(prompt, {})
        
        # Try to parse JSON from response
        try:
            # Extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                remediation = json.loads(json_match.group())
            else:
                remediation = {
                    "solution": response[:200],
                    "example": "See solution",
                    "best_practice": "Follow security guidelines"
                }
        except:
            remediation = {
                "solution": response[:200],
                "example": "See solution",
                "best_practice": "Follow security guidelines"
            }
        
        return remediation
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate remediation: {str(e)}")

@router.websocket("/ws/{scan_id}")
async def websocket_scan_progress(websocket: WebSocket, scan_id: str):
    """WebSocket endpoint for real-time scan progress"""
    await manager.connect(scan_id, websocket)
    try:
        while True:
            # Keep connection alive and receive any messages
            data = await websocket.receive_text()
            
            # Send current progress
            progress = await scan_repository.get_progress(scan_id)
            if progress:
                await manager.send_progress(scan_id, progress)
    except WebSocketDisconnect:
        manager.disconnect(scan_id)
    except Exception as e:
        manager.disconnect(scan_id)

# Background scan task
async def run_security_scan(scan_id: str, repo_url: str):
    """Background task to run security scan"""
    try:
        # Update status to scanning
        await scan_repository.update_scan(scan_id, {
            "status": "scanning",
            "started_at": datetime.utcnow()
        })
        
        progress_data = {
            "scan_id": scan_id,
            "status": "scanning",
            "current_stage": "Initializing scanner...",
            "updated_at": datetime.utcnow()
        }
        await scan_repository.create_or_update_progress(progress_data)
        await manager.send_progress(scan_id, progress_data)
        
        # Simulate scanning process
        import asyncio
        
        # Stage 1: Downloading files
        progress_data["current_stage"] = "Downloading repository files..."
        progress_data["percentage"] = 10
        await scan_repository.create_or_update_progress(progress_data)
        await manager.send_progress(scan_id, progress_data)
        await asyncio.sleep(1)
        
        # Stage 2: Analyzing files
        progress_data["current_stage"] = "Analyzing files for vulnerabilities..."
        progress_data["percentage"] = 30
        progress_data["total_files"] = 150
        await scan_repository.create_or_update_progress(progress_data)
        await manager.send_progress(scan_id, progress_data)
        await asyncio.sleep(1)
        
        # Stage 3: Scanning
        for i in range(4):
            progress_data["files_processed"] = (i + 1) * 30
            progress_data["current_file"] = f"src/file_{i+1}.py"
            progress_data["percentage"] = 40 + (i + 1) * 10
            progress_data["current_stage"] = f"Scanning file_{i+1}.py..."
            await scan_repository.create_or_update_progress(progress_data)
            await manager.send_progress(scan_id, progress_data)
            await asyncio.sleep(0.5)
        
        # Stage 4: Generating AI report
        progress_data["current_stage"] = "Generating AI security report..."
        progress_data["percentage"] = 90
        progress_data["current_file"] = None
        await scan_repository.create_or_update_progress(progress_data)
        await manager.send_progress(scan_id, progress_data)
        await asyncio.sleep(1)
        
        # Create sample vulnerabilities
        sample_vulnerabilities = [
            {
                "scan_id": scan_id,
                "file": "src/auth.py",
                "line": 45,
                "type": "Hardcoded Password",
                "severity": "Critical",
                "evidence": "password='admin123'",
                "impact": "Credentials exposure",
                "recommendation": "Use environment variables or secret manager",
                "created_at": datetime.utcnow()
            },
            {
                "scan_id": scan_id,
                "file": "src/database.py",
                "line": 23,
                "type": "SQL Injection",
                "severity": "High",
                "evidence": "query = f'SELECT * FROM users WHERE id = {user_id}'",
                "impact": "Database compromise",
                "recommendation": "Use parameterized queries",
                "created_at": datetime.utcnow()
            },
            {
                "scan_id": scan_id,
                "file": "src/utils.py",
                "line": 12,
                "type": "Use of eval()",
                "severity": "High",
                "evidence": "result = eval(user_input)",
                "impact": "Code execution",
                "recommendation": "Avoid eval(), use ast.literal_eval() or safer alternatives",
                "created_at": datetime.utcnow()
            }
        ]
        
        for vuln in sample_vulnerabilities:
            await scan_repository.create_vulnerability(vuln)
        
        # Complete scan
        progress_data["status"] = "completed"
        progress_data["percentage"] = 100
        progress_data["current_stage"] = "Scan completed"
        await scan_repository.create_or_update_progress(progress_data)
        await manager.send_progress(scan_id, progress_data)
        
        # Update scan record
        await scan_repository.update_scan(scan_id, {
            "status": "completed",
            "completed_at": datetime.utcnow(),
            "files_scanned": 150,
            "risk_score": 78,
            "total_vulnerabilities": len(sample_vulnerabilities)
        })
        
        # Create security score
        scan = await scan_repository.get_scan_by_id(scan_id)
        previous_score = await scan_repository.get_latest_score(scan["user_id"], scan["repo_url"])
        
        score_data = {
            "user_id": scan["user_id"],
            "repo": scan["repo_url"],
            "previous_score": previous_score["current_score"] if previous_score else 0,
            "current_score": 78,
            "improvement": 78 - (previous_score["current_score"] if previous_score else 0),
            "date": datetime.utcnow()
        }
        await scan_repository.create_security_score(score_data)
        
    except Exception as e:
        await scan_repository.update_scan(scan_id, {
            "status": "failed",
            "error_message": str(e),
            "completed_at": datetime.utcnow()
        })
        
        progress_data = {
            "scan_id": scan_id,
            "status": "failed",
            "current_stage": f"Scan failed: {str(e)}",
            "updated_at": datetime.utcnow()
        }
        await scan_repository.create_or_update_progress(progress_data)
        await manager.send_progress(scan_id, progress_data)

@router.get("/files/{scan_id}")
async def get_scan_files(
    scan_id: str,
    extension: str = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get files with vulnerabilities, optionally filtered by extension"""
    scan = await scan_repository.get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    if scan["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    vulnerabilities = await scan_repository.get_vulnerabilities_by_scan(scan_id)
    
    # Group by file
    files_dict = {}
    for vuln in vulnerabilities:
        file_name = vuln["file"]
        if extension and not file_name.endswith(f".{extension}"):
            continue
        
        if file_name not in files_dict:
            files_dict[file_name] = {
                "file": file_name,
                "issues": 0,
                "vulnerabilities": []
            }
        files_dict[file_name]["issues"] += 1
        files_dict[file_name]["vulnerabilities"].append(vuln)
    
    return list(files_dict.values())