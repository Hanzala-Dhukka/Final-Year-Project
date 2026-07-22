"""
Glossary PDF export service (Module 7.3, spec Step 14).

Generates a downloadable PDF of a single glossary term (or all terms) using
reportlab. Returns raw PDF bytes so the route can stream them with the correct
Content-Type.
"""
from typing import Dict, Any, List, Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)

from app.services import glossary_service


def _styles():
    ss = getSampleStyleSheet()
    ss.add(ParagraphStyle(name="Term", parent=ss["Title"], fontSize=18, spaceAfter=6))
    ss.add(ParagraphStyle(name="Label", parent=ss["Heading3"], textColor=colors.HexColor("#1d4ed8")))
    ss.add(ParagraphStyle(name="Body", parent=ss["BodyText"], fontSize=10, leading=14))
    return ss


def _build_pdf(term: Dict[str, Any]) -> bytes:
    """Render one term to a PDF byte buffer following the spec layout."""
    from io import BytesIO

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=16 * mm, bottomMargin=16 * mm,
        title=f"CyberShield Glossary - {term.get('term')}",
    )
    ss = _styles()
    story = []

    story.append(Paragraph("CyberShield Glossary", ss["Title"]))
    story.append(Paragraph(f"{term.get('term', '')}", ss["Term"]))
    story.append(HRFlowable(width="100%", color=colors.HexColor("#1d4ed8")))
    story.append(Spacer(1, 6))

    def block(label: str, value):
        story.append(Paragraph(label, ss["Label"]))
        if isinstance(value, list):
            value = ", ".join(str(v) for v in value) if value else "—"
        story.append(Paragraph(str(value or "—"), ss["Body"]))
        story.append(Spacer(1, 4))

    block("Definition", term.get("definition"))
    block("Example", term.get("example"))
    block("Prevention", term.get("prevention"))
    block("OWASP Reference", term.get("owasp_reference"))
    block("Related Terms", term.get("related_terms"))

    story.append(Spacer(1, 8))
    story.append(Paragraph("References", ss["Label"]))
    story.append(Paragraph(
        "OWASP Top 10 (2021), CWE, and official framework documentation.", ss["Body"]
    ))

    doc.build(story)
    return buf.getvalue()


async def export_term_pdf(term_id: str, user_id: str = None) -> Optional[bytes]:
    """Return PDF bytes for a single term, or None if not found."""
    term = await glossary_service.get_term(term_id, user_id=user_id)
    if not term:
        return None
    return _build_pdf(term)
