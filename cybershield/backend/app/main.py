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
from app.routes.threat_model_routes import router as threat_model_router
from app.routes.threat_report_routes import router as threat_report_router
from app.routes.chatbot_routes import router as chatbot_router
from app.routers.copilot_routes import router as copilot_router
from app.routers.defense_routes import router as defense_router
from app.routers.lab_routes import router as lab_router
from app.routers.test_routes import router as test_router
from app.routers.session_routes import router as session_router
from app.routes.profile_routes import router as profile_router
from app.routes.dashboard_routes import router as dashboard_router
from app.services.scheduler import scheduler
from app.services.monitoring_jobs import monitor_targets
from app.core.database import connect_to_mongo, close_mongo_connection
from app.middleware.activity_tracker import ActivityTrackerMiddleware

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
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Activity Tracking Middleware ─────────────────────────────────────────────
# Auto-logout after 30 minutes of inactivity
app.add_middleware(
    ActivityTrackerMiddleware,
    inactivity_timeout=30
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(security_router, prefix="/api/v1/security", tags=["Security Analyzer"])
app.include_router(scan_router, prefix="/api/v1/security-scan", tags=["Security Scan"])
app.include_router(github_router, prefix="/api/v1/github", tags=["GitHub Scanner"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(report_router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(monitoring_router, prefix="/api/v1/monitoring", tags=["Monitoring"])
app.include_router(quiz_router)
app.include_router(glossary_router)
app.include_router(owasp_router)
app.include_router(threat_model_router, prefix="/api/v1/threat-model", tags=["Threat Modeling"])
app.include_router(threat_report_router, prefix="/api/v1/threat-model", tags=["Threat Report"])
app.include_router(chatbot_router, prefix="/api/v1/chatbot", tags=["Chatbot"])
app.include_router(copilot_router, prefix="/api/v1/copilot", tags=["AI Security Copilot"])
app.include_router(defense_router, prefix="/api/v1/owasp", tags=["OWASP Defense Mode"])
app.include_router(lab_router, prefix="/api/v1/labs", tags=["Interactive Attack Labs"])
app.include_router(test_router, prefix="/api/v1", tags=["Database Test"])
app.include_router(session_router, prefix="/api/v1", tags=["Session Management"])
app.include_router(profile_router, prefix="/api/v1", tags=["Profile Management"])
app.include_router(dashboard_router, prefix="/api/v1", tags=["Dashboard"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}

# ── Database Connection ───────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    # Connect to MongoDB
    await connect_to_mongo()
    print("MongoDB connected successfully")
    
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
async def shutdown():
    # Close MongoDB connection
    await close_mongo_connection()
    print("MongoDB connection closed")
    
    # Shutdown scheduler
    scheduler.shutdown()
    print("Scheduler shut down.")