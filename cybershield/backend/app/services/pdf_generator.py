from reportlab.platypus import ( 
    SimpleDocTemplate, 
    Paragraph, 
    Spacer 
) 

from reportlab.lib.styles import getSampleStyleSheet 


def generate_pdf_report( 
    report_data, 
    output_path 
): 

    doc = SimpleDocTemplate(output_path) 

    styles = getSampleStyleSheet() 

    elements = [] 

    title = Paragraph( 
        "CyberShield Security Report", 
        styles["Title"] 
    ) 

    elements.append(title) 

    elements.append(Spacer(1, 20)) 

    summary = Paragraph( 
        f""" 
        <b>Risk Level:</b> 
        {report_data['risk_level']} 
        <br/><br/> 

        <b>Summary:</b> 
        {report_data['summary']} 
        """, 
        styles["BodyText"] 
    ) 

    elements.append(summary) 

    elements.append(Spacer(1, 20)) 

    recommendation_title = Paragraph( 
        "Recommendations", 
        styles["Heading2"] 
    ) 

    elements.append(recommendation_title) 

    for rec in report_data["recommendations"]: 

        recommendation = Paragraph( 
            f"• {rec}", 
            styles["BodyText"] 
        ) 

        elements.append(recommendation) 

    doc.build(elements)
