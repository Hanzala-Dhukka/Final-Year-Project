from typing import Dict, Any, List, Optional
from datetime import datetime
from app.services.file_analyzer import FileAnalyzer


class ReportComparator:
    """Compare two security reports and show improvements"""
    
    @staticmethod
    def compare_reports(old_report_content: str, new_report_content: str, 
                        old_filename: str = "old", new_filename: str = "new") -> Dict[str, Any]:
        """
        Compare two security reports
        
        Args:
            old_report_content: Content of old report
            new_report_content: Content of new report
            old_filename: Name of old report file
            new_filename: Name of new report file
            
        Returns:
            Comparison results with improvements
        """
        # Analyze both reports
        old_analysis = FileAnalyzer.analyze_file(old_filename, old_report_content)
        new_analysis = FileAnalyzer.analyze_file(new_filename, new_report_content)
        
        # Extract severity counts
        old_critical = old_analysis.get("critical", 0)
        old_high = old_analysis.get("high", 0)
        old_medium = old_analysis.get("medium", 0)
        old_low = old_analysis.get("low", 0)
        old_total = old_analysis.get("total_findings", old_analysis.get("total_threats", 0))
        
        new_critical = new_analysis.get("critical", 0)
        new_high = new_analysis.get("high", 0)
        new_medium = new_analysis.get("medium", 0)
        new_low = new_analysis.get("low", 0)
        new_total = new_analysis.get("total_findings", new_analysis.get("total_threats", 0))
        
        # Calculate improvements
        critical_fixed = old_critical - new_critical
        high_fixed = old_high - new_high
        medium_fixed = old_medium - new_medium
        low_fixed = old_low - new_low
        
        critical_remaining = new_critical
        high_remaining = new_high
        medium_remaining = new_medium
        low_remaining = new_low
        
        # Calculate improvement percentage
        if old_total > 0:
            total_fixed = old_total - new_total
            improvement_percentage = round((total_fixed / old_total) * 100, 1)
        else:
            improvement_percentage = 0.0
        
        # Determine overall risk level
        if new_critical > 0:
            new_risk_level = "Critical"
        elif new_high > 5:
            new_risk_level = "High"
        elif new_high > 0 or new_medium > 10:
            new_risk_level = "Medium"
        else:
            new_risk_level = "Low"
        
        # Generate summary
        summary = ReportComparator._generate_summary(
            old_critical, old_high, old_medium, old_total,
            new_critical, new_high, new_medium, new_total,
            improvement_percentage, new_risk_level
        )
        
        # Generate chart data
        chart_data = {
            "old": {
                "critical": old_critical,
                "high": old_high,
                "medium": old_medium,
                "low": old_low,
                "total": old_total
            },
            "new": {
                "critical": new_critical,
                "high": new_high,
                "medium": new_medium,
                "low": new_low,
                "total": new_total
            },
            "improvements": {
                "critical": critical_fixed,
                "high": high_fixed,
                "medium": medium_fixed,
                "low": low_fixed
            }
        }
        
        return {
            "improvement_percentage": improvement_percentage,
            "critical_fixed": max(0, critical_fixed),
            "critical_remaining": critical_remaining,
            "high_fixed": max(0, high_fixed),
            "high_remaining": high_remaining,
            "medium_fixed": max(0, medium_fixed),
            "medium_remaining": medium_remaining,
            "low_fixed": max(0, low_fixed),
            "low_remaining": low_remaining,
            "old_risk_level": ReportComparator._determine_risk_level(old_critical, old_high, old_medium),
            "new_risk_level": new_risk_level,
            "summary": summary,
            "chart_data": chart_data,
            "old_analysis": old_analysis,
            "new_analysis": new_analysis
        }
    
    @staticmethod
    def _determine_risk_level(critical: int, high: int, medium: int) -> str:
        """Determine risk level from severity counts"""
        if critical > 0:
            return "Critical"
        elif high > 5:
            return "High"
        elif high > 0 or medium > 10:
            return "Medium"
        else:
            return "Low"
    
    @staticmethod
    def _generate_summary(old_critical: int, old_high: int, old_medium: int, old_total: int,
                         new_critical: int, new_high: int, new_medium: int, new_total: int,
                         improvement_pct: float, new_risk: str) -> str:
        """Generate human-readable summary of comparison"""
        parts = []
        
        # Overall improvement
        if improvement_pct > 0:
            parts.append(f"Overall improvement of {improvement_pct}% in security posture.")
        else:
            parts.append("No improvement detected in security posture.")
        
        # Critical fixes
        if old_critical > 0 and new_critical == 0:
            parts.append(f"All {old_critical} critical vulnerabilities have been fixed!")
        elif old_critical > new_critical:
            parts.append(f"{old_critical - new_critical} critical vulnerabilities fixed, {new_critical} remaining.")
        elif new_critical > 0:
            parts.append(f"WARNING: {new_critical} critical vulnerabilities still present.")
        
        # High fixes
        if old_high > new_high:
            parts.append(f"{old_high - new_high} high-severity issues resolved.")
        
        # Current status
        parts.append(f"Current risk level: {new_risk}.")
        
        return " ".join(parts)
    
    @staticmethod
    def compare_from_analyses(old_analysis: Dict[str, Any], new_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compare two pre-analyzed reports
        
        Args:
            old_analysis: Analysis of old report
            new_analysis: Analysis of new report
            
        Returns:
            Comparison results
        """
        # Extract counts from analyses
        old_critical = old_analysis.get("critical", 0)
        old_high = old_analysis.get("high", 0)
        old_medium = old_analysis.get("medium", 0)
        old_total = old_analysis.get("total_findings", old_analysis.get("total_threats", 0))
        
        new_critical = new_analysis.get("critical", 0)
        new_high = new_analysis.get("high", 0)
        new_medium = new_analysis.get("medium", 0)
        new_total = new_analysis.get("total_findings", new_analysis.get("total_threats", 0))
        
        # Calculate improvements
        critical_fixed = old_critical - new_critical
        high_fixed = old_high - new_high
        medium_fixed = old_medium - new_medium
        
        if old_total > 0:
            total_fixed = old_total - new_total
            improvement_percentage = round((total_fixed / old_total) * 100, 1)
        else:
            improvement_percentage = 0.0
        
        new_risk_level = ReportComparator._determine_risk_level(new_critical, new_high, new_medium)
        
        summary = ReportComparator._generate_summary(
            old_critical, old_high, old_medium, old_total,
            new_critical, new_high, new_medium, new_total,
            improvement_percentage, new_risk_level
        )
        
        chart_data = {
            "old": {
                "critical": old_critical,
                "high": old_high,
                "medium": old_medium,
                "total": old_total
            },
            "new": {
                "critical": new_critical,
                "high": new_high,
                "medium": new_medium,
                "total": new_total
            },
            "improvements": {
                "critical": max(0, critical_fixed),
                "high": max(0, high_fixed),
                "medium": max(0, medium_fixed)
            }
        }
        
        return {
            "improvement_percentage": improvement_percentage,
            "critical_fixed": max(0, critical_fixed),
            "critical_remaining": new_critical,
            "high_fixed": max(0, high_fixed),
            "high_remaining": new_high,
            "medium_fixed": max(0, medium_fixed),
            "medium_remaining": new_medium,
            "old_risk_level": ReportComparator._determine_risk_level(old_critical, old_high, old_medium),
            "new_risk_level": new_risk_level,
            "summary": summary,
            "chart_data": chart_data
        }