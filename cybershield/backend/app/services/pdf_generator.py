def generate_pdf_report(report, output_path):
    """
    Generates a PDF security report.
    Uses a simple text-based approach if reportlab is not available.
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        
        c = canvas.Canvas(output_path, pagesize=letter)
        width, height = letter
        
        c.setFont("Helvetica-Bold", 24)
        c.drawString(50, height - 50, "CyberShield Security Report")
        
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, height - 100, "Risk Level:")
        c.setFont("Helvetica", 14)
        c.drawString(150, height - 100, report.get("risk_level", "Unknown"))
        
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, height - 130, "Summary:")
        c.setFont("Helvetica", 12)
        text_obj = c.beginText(50, height - 150)
        text_obj.textLines(report.get("summary", ""))
        c.drawText(text_obj)
        
        # Add Recommendations
        recommendations = report.get("recommendations", [])
        if recommendations:
            c.setFont("Helvetica-Bold", 14)
            c.drawString(50, height - 250, "Recommendations:")
            c.setFont("Helvetica", 12)
            y_pos = height - 270
            for rec in recommendations:
                if y_pos < 50:
                    c.showPage()
                    y_pos = height - 50
                c.drawString(60, y_pos, f"- {rec}")
                y_pos -= 20
        
        c.save()
        return output_path
        
    except ImportError:
        with open(output_path.replace(".pdf", ".txt"), "w") as f:
            f.write("CyberShield Security Report\n")
            f.write("=" * 40 + "\n\n")
            f.write(f"Risk Level: {report.get('risk_level', 'Unknown')}\n\n")
            f.write(f"Summary: {report.get('summary', '')}\n\n")
            f.write("Recommendation: Review the findings and rotate any leaked secrets immediately.\n")
        return output_path.replace(".pdf", ".txt")