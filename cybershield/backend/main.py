from fastapi import FastAPI
from app.database.db import database
from app.routes.auth_routes import router as auth_router

app = FastAPI()

app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"]
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