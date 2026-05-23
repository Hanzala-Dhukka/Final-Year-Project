from fastapi import APIRouter, Depends, HTTPException
import requests
from app.utils.dependencies import verify_token
from app.services.header_analyzer import analyze_security_headers

router = APIRouter()


@router.post("/analyze-headers")
async def analyze_headers(
    data: dict,
    user_data: dict = Depends(verify_token)
):
    url = data.get("url")

    if not url:
        raise HTTPException(
            status_code=400,
            detail="URL is required"
        )

    if not url.startswith("http"):
        url = f"https://{url}"

    try:
        response = requests.get(url)
        headers = dict(response.headers)
        analysis = analyze_security_headers(headers)

        return {
            "url": url,
            "analysis": analysis,
            "headers": headers
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/status")
async def get_security_status(user_data: dict = Depends(verify_token)):
    """
    Check the overall security status of the system.
    Requires authentication.
    """
    return {
        "status": "secure",
        "shield_active": True,
        "last_scan": "2026-05-22 10:00:00",
        "threats_found": 0,
        "monitored_assets": 12
    }


@router.post("/scan")
async def initiate_scan(user_data: dict = Depends(verify_token)):
    """
    Trigger a new security scan.
    Requires authentication.
    """
    return {
        "message": "Security scan initiated successfully",
        "scan_id": "scan_12345",
        "estimated_time": "5 minutes"
    }
