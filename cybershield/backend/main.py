import uvicorn
from app.config.settings import settings

if __name__ == "__main__":
    print(f"Starting {settings.APP_NAME} in {settings.APP_ENV} mode...")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "CyberShield Backend Running"}