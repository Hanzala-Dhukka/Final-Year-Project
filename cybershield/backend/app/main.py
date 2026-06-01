from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.routes.auth_routes import router as auth_router
from app.routes.security_routes import router as security_router
from app.routes.scan_routes import router as scan_router
from app.routes.github_routes import router as github_router
from app.routes.analytics_routes import router as analytics_router

# ── App instance ─────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for CyberShield Final Year Project",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(security_router, prefix="/api/v1/security", tags=["Security Analyzer"])
app.include_router(scan_router, prefix="/api/v1/scan", tags=["Scan"])
app.include_router(github_router, prefix="/api/v1/github", tags=["GitHub Scanner"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
