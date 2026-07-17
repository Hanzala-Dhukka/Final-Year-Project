"""
AI Code Review API routes (Module 5.3).

Endpoints (mounted under /code-review):
  POST   /code-review            Review pasted code
  POST   /code-review/upload     Review an uploaded source file
  GET    /code-review/history    List the user's past reviews
  GET    /code-review/{id}       Get a full review report
  DELETE /code-review/{id}       Delete a review
  GET    /code-review/{id}/export Export a report as json | markdown | pdf
"""
import io
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import JSONResponse, PlainTextResponse, Response

from app.dependencies.auth import get_current_user
from app.schemas.code_review_schema import (
    CodeReviewRequest,
    CodeReviewResponse,
    CodeReviewHistoryItem,
    CodeReviewReport,
)
from app.services import code_review_service as svc
from app.services.language_detector import is_allowed_extension
from app.config.settings import settings

router = APIRouter()

MAX_UPLOAD_BYTES = 200_000  # ~200 KB source limit


@router.post("", response_model=CodeReviewResponse)
async def review_pasted_code(payload: CodeReviewRequest, user=Depends(get_current_user)):
    """Review pasted source code."""
    user_id = str(user["_id"])
    result = await svc.review_code(
        user_id, payload.code, payload.language, project_id=payload.project_id
    )
    return CodeReviewResponse(**result)


@router.post("/upload", response_model=CodeReviewResponse)
async def review_uploaded_file(
    file: UploadFile = File(...),
    language: str = None,
    user=Depends(get_current_user),
):
    """Review an uploaded source file (multipart/form-data)."""
    filename = file.filename or ""
    if not is_allowed_extension(filename):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Allowed: .py .js .ts .java .php .go "
                   ".cs .cpp .c .html .css .sql .sh",
        )

    raw = await file.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max ~200 KB).")

    try:
        code = raw.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File is not valid UTF-8 text.")

    user_id = str(user["_id"])
    result = await svc.review_code(
        user_id, code, language, filename=filename
    )
    return CodeReviewResponse(**result)


@router.get("/history", response_model=list[CodeReviewHistoryItem])
async def review_history(user=Depends(get_current_user)):
    """List the user's past reviews."""
    user_id = str(user["_id"])
    return await svc.list_reviews(user_id)


@router.get("/{review_id}", response_model=CodeReviewReport)
async def get_review(review_id: str, user=Depends(get_current_user)):
    """Get a full review report."""
    user_id = str(user["_id"])
    result = await svc.get_report(review_id, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Review not found")
    return CodeReviewReport(**result)


@router.delete("/{review_id}")
async def delete_review(review_id: str, user=Depends(get_current_user)):
    """Delete a review and its report."""
    user_id = str(user["_id"])
    deleted = await svc.delete_review(review_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"detail": "Review deleted", "review_id": review_id}


@router.get("/{review_id}/export")
async def export_review(
    review_id: str,
    format: str = Query("json", pattern="^(json|markdown|pdf)$"),
    user=Depends(get_current_user),
):
    """Export a review as JSON, Markdown, or PDF."""
    user_id = str(user["_id"])
    result = await svc.get_report(review_id, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Review not found")

    if format == "json":
        return JSONResponse(content=svc.to_json(result))

    if format == "markdown":
        return PlainTextResponse(
            svc.to_markdown(result),
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=code_review_{review_id}.md"},
        )

    # PDF
    html = svc.to_html(result)
    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html).write_pdf()
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=code_review_{review_id}.pdf"},
        )
    except Exception:
        # Fallback to HTML if weasyprint is unavailable
        return Response(
            content=html,
            media_type="text/html",
            headers={"Content-Disposition": f"attachment; filename=code_review_{review_id}.html"},
        )
