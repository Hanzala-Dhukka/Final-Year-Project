from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.routes.auth_routes import router as auth_router
from app.routes.security_routes import router as security_router
from app.routes.scan_routes import router as scan_router
from app.routes.github_routes import router as github_router
from app.routes.analytics_routes import router as analytics_router
from app.routes.report_routes import router as report_router
from app.routes.admin_routes import router as admin_router
from app.routes.monitoring_routes import router as monitoring_router
from app.routes.quiz_routes import router as quiz_router
from app.routes.glossary_routes import router as glossary_router
from app.routes.owasp_routes import router as owasp_router
from app.services.scheduler import scheduler
from app.services.monitoring_jobs import monitor_targets

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
app.include_router(report_router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(monitoring_router, prefix="/api/v1/monitoring", tags=["Monitoring"])
app.include_router(quiz_router)
app.include_router(glossary_router)
app.include_router(owasp_router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}

# ── Scheduler ─────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    # Add scheduled jobs
    scheduler.add_job(
        monitor_targets,
        "interval",
        minutes=30
    )
    # Start the scheduler
    scheduler.start()
    print("Scheduler started. Monitoring jobs scheduled every 30 minutes.")

@app.on_event("shutdown")
async def shutdown_scheduler():
    scheduler.shutdown()
    print("Scheduler shut down.")
