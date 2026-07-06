import json
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
import os


class FileAnalyzer:
    """Analyze uploaded security report files"""
    
    @staticmethod
    def detect_report_type(filename: str, content: str) -> str:
        """
        Detect the type of security report
        
        Args:
            filename: Name of the uploaded file
            content: File content
            
        Returns:
            Report type string
        """
        filename_lower = filename.lower()
        
        # GitHub Scan Report
        if "github" in filename_lower or "scan" in filename_lower:
            if "findings" in content or "vulnerabilities" in content:
                return "GitHub Scan"
        
        # Threat Report
        if "threat" in filename_lower:
            if "threats" in content or "risk" in content:
                return "Threat Report"
        
        # Security Headers Report
        if "header" in filename_lower or "security" in filename_lower:
            if "headers" in content or "x-frame-options" in content.lower():
                return "Security Headers"
        
        # OWASP Report
        if "owasp" in filename_lower:
            if "simulations" in content or "tests" in content:
                return "OWASP Simulation"
        
        # Try to detect from content
        try:
            data = json.loads(content)
            if "findings" in data:
                return "GitHub Scan"
            elif "threats" in data:
                return "Threat Report"
            elif "headers" in data:
                return "Security Headers"
            elif "simulations" in data:
                return "OWASP Simulation"
        except:
            pass
        
        # Default based on file extension
        if filename_lower.endswith('.json'):
            return "JSON Report"
        elif filename_lower.endswith('.pdf'):
            return "PDF Report"
        elif filename_lower.endswith('.txt') or filename_lower.endswith('.md'):
            return "Text Report"
        elif filename_lower.endswith('.csv'):
            return "CSV Report"
        
        return "Unknown"
    
    @staticmethod
    def analyze_github_scan(content: str) -> Dict[str, Any]:
        """Analyze GitHub scan report"""
        try:
            data = json.loads(content)
            findings = data.get("findings", [])
            
            # Categorize by severity
            critical = len([f for f in findings if f.get("severity", "").lower() == "critical"])
            high = len([f for f in findings if f.get("severity", "").lower() == "high"])
            medium = len([f for f in findings if f.get("severity", "").lower() == "medium"])
            low = len([f for f in findings if f.get("severity", "").lower() == "low"])
            
            # Extract top issues
            top_issues = []
            for finding in findings[:5]:
                top_issues.append({
                    "title": finding.get("title", finding.get("rule", "Unknown")),
                    "severity": finding.get("severity", "Unknown"),
                    "location": finding.get("location", finding.get("file", "Unknown"))
                })
            
            return {
                "total_findings": len(findings),
                "critical": critical,
                "high": high,
                "medium": medium,
                "low": low,
                "top_issues": top_issues,
                "summary": f"Found {len(findings)} vulnerabilities: {critical} critical, {high} high, {medium} medium, {low} low"
            }
        except Exception as e:
            return {
                "error": str(e),
                "summary": "Failed to parse GitHub scan report"
            }
    
    @staticmethod
    def analyze_threat_report(content: str) -> Dict[str, Any]:
        """Analyze threat model report"""
        try:
            data = json.loads(content)
            threats = data.get("threats", [])
            
            # Categorize by severity
            critical = len([t for t in threats if t.get("severity", "").lower() == "critical"])
            high = len([t for t in threats if t.get("severity", "").lower() == "high"])
            medium = len([t for t in threats if t.get("severity", "").lower() == "medium"])
            low = len([t for t in threats if t.get("severity", "").lower() == "low"])
            
            # Extract top threats
            top_threats = []
            for threat in threats[:5]:
                top_threats.append({
                    "threat": threat.get("threat", "Unknown"),
                    "severity": threat.get("severity", "Unknown"),
                    "technology": threat.get("technology", "Unknown")
                })
            
            return {
                "total_threats": len(threats),
                "critical": critical,
                "high": high,
                "medium": medium,
                "low": low,
                "top_threats": top_threats,
                "summary": f"Identified {len(threats)} threats: {critical} critical, {high} high, {medium} medium, {low} low"
            }
        except Exception as e:
            return {
                "error": str(e),
                "summary": "Failed to parse threat report"
            }
    
    @staticmethod
    def analyze_security_headers(content: str) -> Dict[str, Any]:
        """Analyze security headers report"""
        try:
            data = json.loads(content)
            headers = data.get("headers", {})
            
            # Check for important security headers
            security_headers = {
                "X-Frame-Options": headers.get("X-Frame-Options", "Missing"),
                "X-Content-Type-Options": headers.get("X-Content-Type-Options", "Missing"),
                "Strict-Transport-Security": headers.get("Strict-Transport-Security", "Missing"),
                "Content-Security-Policy": headers.get("Content-Security-Policy", "Missing"),
                "X-XSS-Protection": headers.get("X-XSS-Protection", "Missing")
            }
            
            missing_count = sum(1 for v in security_headers.values() if v == "Missing")
            present_count = len(security_headers) - missing_count
            
            return {
                "total_headers": len(security_headers),
                "present": present_count,
                "missing": missing_count,
                "headers": security_headers,
                "summary": f"Security headers: {present_count}/{len(security_headers)} present, {missing_count} missing"
            }
        except Exception as e:
            return {
                "error": str(e),
                "summary": "Failed to parse security headers report"
            }
    
    @staticmethod
    def analyze_owasp_report(content: str) -> Dict[str, Any]:
        """Analyze OWASP simulation report"""
        try:
            data = json.loads(content)
            simulations = data.get("simulations", [])
            
            # Categorize by result
            passed = len([s for s in simulations if s.get("result", "").lower() == "pass"])
            failed = len([s for s in simulations if s.get("result", "").lower() == "fail"])
            warning = len([s for s in simulations if s.get("result", "").lower() == "warning"])
            
            # Extract failed tests
            failed_tests = []
            for sim in simulations:
                if sim.get("result", "").lower() == "fail":
                    failed_tests.append({
                        "test": sim.get("test", sim.get("name", "Unknown")),
                        "category": sim.get("category", "Unknown")
                    })
            
            return {
                "total_tests": len(simulations),
                "passed": passed,
                "failed": failed,
                "warning": warning,
                "failed_tests": failed_tests[:5],
                "summary": f"OWASP tests: {passed} passed, {failed} failed, {warning} warnings out of {len(simulations)}"
            }
        except Exception as e:
            return {
                "error": str(e),
                "summary": "Failed to parse OWASP report"
            }
    
    @staticmethod
    def analyze_text_report(content: str) -> Dict[str, Any]:
        """Analyze plain text report"""
        # Count lines and words
        lines = content.split('\n')
        words = content.split()
        
        # Look for security keywords
        keywords = ["vulnerability", "critical", "high", "medium", "low", "security", "threat", "risk"]
        keyword_count = sum(1 for word in words if word.lower() in keywords)
        
        return {
            "total_lines": len(lines),
            "total_words": len(words),
            "security_keywords_found": keyword_count,
            "summary": f"Text report with {len(lines)} lines and {len(words)} words"
        }
    
    @staticmethod
    def analyze_file(filename: str, content: str) -> Dict[str, Any]:
        """
        Analyze uploaded file and return summary
        
        Args:
            filename: Name of the file
            content: File content
            
        Returns:
            Analysis summary
        """
        report_type = FileAnalyzer.detect_report_type(filename, content)
        
        analysis = {
            "filename": filename,
            "report_type": report_type,
            "analyzed_at": datetime.utcnow().isoformat()
        }
        
        # Analyze based on report type
        if report_type == "GitHub Scan":
            analysis.update(FileAnalyzer.analyze_github_scan(content))
        elif report_type == "Threat Report":
            analysis.update(FileAnalyzer.analyze_threat_report(content))
        elif report_type == "Security Headers":
            analysis.update(FileAnalyzer.analyze_security_headers(content))
        elif report_type == "OWASP Simulation":
            analysis.update(FileAnalyzer.analyze_owasp_report(content))
        elif report_type in ["Text Report", "JSON Report", "CSV Report"]:
            analysis.update(FileAnalyzer.analyze_text_report(content))
        else:
            analysis["summary"] = "Unknown report type - basic analysis only"
        
        return analysis
    
    @staticmethod
    def save_uploaded_file(file_content: bytes, filename: str, upload_dir: str = "uploads/reports") -> str:
        """
        Save uploaded file to disk
        
        Args:
            file_content: File content as bytes
            filename: Original filename
            upload_dir: Upload directory path
            
        Returns:
            Saved file path
        """
        # Create upload directory if it doesn't exist
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        base_name, ext = os.path.splitext(filename)
        unique_filename = f"{base_name}_{timestamp}{ext}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        return file_path