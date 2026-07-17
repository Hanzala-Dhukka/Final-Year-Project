from fastapi import APIRouter
from app.database.db import database

router = APIRouter()

@router.get("/database-test")
async def database_test():
    collections = await database.list_collection_names()

    return {
        "status": "Connected",
        "database": database.name,
        "collections": collections
    }
