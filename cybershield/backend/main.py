from fastapi import FastAPI
from app.database.db import database
from app.routes.auth_routes import router as auth_router
from app.routes.user_routes import router as user_router
from app.routes.scan_routes import router as scan_router

app = FastAPI()

app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"]
)

app.include_router(
    user_router,
    prefix="/api/users",
    tags=["User Management"]
)

app.include_router(
    scan_router,
    prefix="/api/scans",
    tags=["Security Scans"]
)

@app.get("/")
def home():
    return {
        "message": "CyberShield Backend Running"
    }

@app.get("/test-db")
async def test_db():

    collections = await database.list_collection_names()

    return {
        "status": "connected",
        "database": "cybershield",
        "collections": collections
    }

@app.get("/create-test")
async def create_test():

    test_collection = database["test_collection"]

    data = {
        "message": "MongoDB Working"
    }

    result = await test_collection.insert_one(data)

    return {
        "inserted_id": str(result.inserted_id)
    }