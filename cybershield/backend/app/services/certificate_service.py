"""
Certificate Service - PDF Certificate Generation
Generates certificates for users who complete the training
Uses MongoDB for data storage
"""
from typing import Dict, Any, Optional
from datetime import datetime
import os
from app.services.mongo_service import save_certificate, get_user_certificate
from app.services.progress_service import ProgressService
from app.services.analytics_service import AnalyticsService


class CertificateService:
    """Service for generating and managing certificates"""
    
    # Certificate requirements
    REQUIRED_COMPLETION = 80.0  # 80% of labs
    REQUIRED_AVERAGE = 75.0    # 75% average score
    
    # In-memory storage for certificates
    certificates: Dict[str, Dict[str, Any]] = {}
    
    @classmethod
    def check_eligibility(cls, user_id: str) -> Dict[str, Any]:
        """
        Check if user is eligible for a certificate
        
        Args:
            user_id: User identifier
            
        Returns:
            Eligibility information
        """
        progress = ProgressService.get_user_progress(user_id)
        analytics = AnalyticsService.get_learning_analytics(user_id)
        
        # Calculate completion percentage
        total_labs = analytics.get("total_labs", 10)
        completed_labs = analytics.get("completed_labs", 0)
        completion_percentage = (completed_labs / total_labs * 100) if total_labs > 0 else 0
        
        average_score = analytics.get("average_score", 0)
        
        eligible = (
            completion_percentage >= cls.REQUIRED_COMPLETION and
            average_score >= cls.REQUIRED_AVERAGE
        )
        
        return {
            "eligible": eligible,
            "reason": "Eligible for certificate!" if eligible else 
                      f"Need {cls.REQUIRED_COMPLETION}% completion and {cls.REQUIRED_AVERAGE}% average score",
            "completion_percentage": round(completion_percentage, 1),
            "average_score": average_score,
            "required_completion": cls.REQUIRED_COMPLETION,
            "required_average": cls.REQUIRED_AVERAGE
        }
    
    @classmethod
    def generate_certificate(cls, user_id: str, user_name: str = "User") -> Dict[str, Any]:
        """
        Generate a PDF certificate for a user
        
        Args:
            user_id: User identifier
            user_name: User's display name
            
        Returns:
            Certificate information
        """
        eligibility = cls.check_eligibility(user_id)
        
        if not eligibility["eligible"]:
            return {
                "certificate": None,
                "status": "Not Eligible",
                "eligibility": eligibility
            }
        
        progress = ProgressService.get_user_progress(user_id)
        analytics = AnalyticsService.get_learning_analytics(user_id)
        
        # Generate certificate ID
        certificate_id = f"CS-{datetime.now().year}-{str(len(cls.certificates) + 1).zfill(5)}"
        
        # Determine skill level
        skill = cls._get_skill_level(analytics)
        
        # Create certificate data
        certificate_data = {
            "certificate_id": certificate_id,
            "user_id": user_id,
            "user_name": user_name,
            "course": "CyberShield OWASP Security Training",
            "level": skill,
            "completed_labs": analytics["completed_labs"],
            "average_score": analytics["average_score"],
            "date_issued": datetime.now().isoformat()
        }
        
        # Generate PDF
        pdf_path = cls._generate_pdf(certificate_data)
        
        certificate_data["file_path"] = pdf_path
        cls.certificates[user_id] = certificate_data
        
        # Save to MongoDB
        try:
            save_certificate(
                user_id=user_id,
                certificate_id=certificate_id,
                course="CyberShield OWASP Security Training",
                date=datetime.now().isoformat(),
                file_path=pdf_path
            )
        except Exception as e:
            print(f"Error saving certificate to MongoDB: {e}")
        
        return {
            "certificate": f"/certificates/{certificate_id}.pdf",
            "status": "Generated",
            "eligibility": eligibility,
            "certificate_data": certificate_data
        }
    
    @classmethod
    def _get_skill_level(cls, analytics: Dict[str, Any]) -> str:
        """Determine skill level based on analytics"""
        avg_score = analytics.get("average_score", 0)
        completed_labs = analytics.get("completed_labs", 0)
        total_xp = analytics.get("total_xp", 0)
        
        if avg_score >= 90 and completed_labs >= 40 and total_xp >= 5000:
            return "Security Professional"
        elif avg_score >= 80 and completed_labs >= 20:
            return "Expert"
        elif avg_score >= 60 and completed_labs >= 10:
            return "Advanced"
        elif avg_score >= 40 and completed_labs >= 5:
            return "Intermediate"
        else:
            return "Beginner"
    
    @classmethod
    def _generate_pdf(cls, certificate_data: Dict[str, Any]) -> str:
        """
        Generate PDF certificate using reportlab
        
        Args:
            certificate_data: Certificate information
            
        Returns:
            Path to generated PDF
        """
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib.units import inch
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
            from reportlab.lib.enums import TA_CENTER
            from reportlab.lib.colors import Color, black, blue
            from reportlab.pdfgen import canvas
            
            # Create certificates directory if it doesn't exist
            cert_dir = "app/assets/certificates"
            os.makedirs(cert_dir, exist_ok=True)
            
            pdf_path = os.path.join(cert_dir, f"{certificate_data['certificate_id']}.pdf")
            
            # Create PDF
            doc = SimpleDocTemplate(pdf_path, pagesize=letter)
            styles = getSampleStyleSheet()
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                alignment=TA_CENTER,
                spaceAfter=30,
                textColor=blue
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=18,
                alignment=TA_CENTER,
                spaceAfter=20
            )
            
            body_style = ParagraphStyle(
                'CustomBody',
                parent=styles['Normal'],
                fontSize=14,
                alignment=TA_CENTER,
                spaceAfter=15
            )
            
            story = []
            
            # Certificate title
            story.append(Paragraph("CyberShield Certificate", title_style))
            story.append(Spacer(1, 20))
            
            # Certificate body
            story.append(Paragraph("This certifies that", body_style))
            story.append(Spacer(1, 10))
            
            story.append(Paragraph(f"<b>{certificate_data['user_name']}</b>", heading_style))
            story.append(Spacer(1, 10))
            
            story.append(Paragraph(
                f"has successfully completed<br/>{certificate_data['course']}",
                body_style
            ))
            story.append(Spacer(1, 30))
            
            # Level and stats
            story.append(Paragraph(f"Level: {certificate_data['level']}", body_style))
            story.append(Paragraph(f"Completed: {certificate_data['completed_labs']} Labs", body_style))
            story.append(Paragraph(f"Average Score: {certificate_data['average_score']}%", body_style))
            story.append(Spacer(1, 30))
            
            # Certificate ID
            story.append(Paragraph(
                f"Certificate ID: {certificate_data['certificate_id']}",
                body_style
            ))
            story.append(Paragraph(
                f"Date: {datetime.now().strftime('%B %d, %Y')}",
                body_style
            ))
            
            doc.build(story)
            
            return pdf_path
            
        except ImportError:
            # Fallback if reportlab not installed
            print("Warning: reportlab not installed. Certificate not generated.")
            return f"certificates/{certificate_data['certificate_id']}.pdf"
        except Exception as e:
            print(f"Error generating PDF: {e}")
            return f"certificates/{certificate_data['certificate_id']}.pdf"
    
    @classmethod
    def get_user_certificate(cls, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's certificate if exists"""
        if user_id not in cls.certificates:
            try:
                cls.certificates[user_id] = get_user_certificate(user_id)
            except Exception:
                return None
        return cls.certificates.get(user_id)


# Standalone functions
def check_certificate_eligibility(user_id: str) -> Dict[str, Any]:
    """Check certificate eligibility"""
    return CertificateService.check_eligibility(user_id)


def generate_certificate(user_id: str, user_name: str = "User") -> Dict[str, Any]:
    """Generate certificate"""
    return CertificateService.generate_certificate(user_id, user_name)


def get_certificate(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user certificate"""
    return CertificateService.get_user_certificate(user_id)