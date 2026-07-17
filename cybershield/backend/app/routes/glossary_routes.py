from fastapi import APIRouter
from app.data.glossary import GLOSSARY

router = APIRouter(
    prefix="/api/v1/glossary",
    tags=["Glossary"]
)

@router.get("/")
async def get_glossary():
    """Get the full glossary of cybersecurity terms."""
    return GLOSSARY

@router.get("/search")
async def search_glossary(term: str):
    """Search for a specific term in the glossary."""
    results = [
        item
        for item in GLOSSARY
        if term.lower() in item["term"].lower()
    ]
    return results

@router.get("/progress")
async def get_glossary_progress():
    """Learning progress for the glossary (total terms available)."""
    total = len(GLOSSARY)
    return {
        "terms_learned": 0,
        "total_terms": total,
        "percentage": 0,
    }
