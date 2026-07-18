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
from app.routes.chatbot_routes import router as chatbot_router
from app.routers.session_routes import router as session_router
from app.routes.threat_model_routes import router as threat_model_router
from app.routes.threat_report_routes import router as threat_report_router
from app.routes.profile_routes import router as profile_routes_router
from app.routers.progress_routes import router as progress_router
from app.routers.challenge_routes import router as challenge_router
from app.routers.copilot_routes import router as copilot_router
from app.routers.defense_routes import router as defense_router
from app.routers.lab_routes import router as lab_router
from app.routes.owasp_routes import router as owasp_simulate_router
from app.routes.threat_dashboard_routes import router as threat_dashboard_router
from app.api.project_routes import router as project_router
from app.api.workspace_routes import router as workspace_router
from app.api.collaboration_routes import router as collaboration_router
from app.api.user_routes import router as user_router
from app.api.ai_chat_routes import router as ai_chat_router
from app.api.code_review_routes import router as code_review_router
from app.api.remediation_routes import router as remediation_router
from app.api.copilot_routes import router as security_copilot_router
from app.routes.checklist_routes import router as checklist_router
from app.api.ai_checklist_routes import router as ai_checklist_router
from app.routes.compliance_routes import router as compliance_router
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
app.include_router(session_router, prefix="/api/v1/auth", tags=["Sessions"])
app.include_router(security_router, prefix="/api/v1/security", tags=["Security Analyzer"])
app.include_router(scan_router, prefix="/api/v1/scan", tags=["Scan"])
app.include_router(github_router, prefix="/api/v1/github", tags=["GitHub Scanner"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])
# report_routes defines its own "/reports" and "/report/{id}" paths,
# so mount under /api/v1 (not /api/v1/reports) to avoid a double prefix.
app.include_router(report_router, prefix="/api/v1", tags=["Reports"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(monitoring_router, prefix="/api/v1/monitoring", tags=["Monitoring"])
# quiz_routes & glossary_routes already carry their own "/api/v1/quiz" & "/api/v1/glossary" prefixes
app.include_router(quiz_router)
app.include_router(glossary_router)
# owasp_routes already carries its own prefix "/api/v1/owasp" internally — do NOT add it here
app.include_router(owasp_simulate_router, tags=["OWASP Simulator"])
app.include_router(progress_router, prefix="/api/v1", tags=["Progress"])
app.include_router(threat_dashboard_router, prefix="/api/v1/threat-dashboard", tags=["Threat Dashboard"])
app.include_router(project_router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(workspace_router, prefix="/api/v1/projects", tags=["Workspace"])
app.include_router(collaboration_router, prefix="/api/v1/projects", tags=["Collaboration"])
app.include_router(user_router, prefix="/api/v1", tags=["User Profile"])
# ── Additional feature routers (formerly unregistered) ───────────────────────
app.include_router(chatbot_router, prefix="/api/v1/chatbot", tags=["AI Chatbot"])
app.include_router(copilot_router, prefix="/api/v1/copilot", tags=["AI Copilot"])
app.include_router(challenge_router, prefix="/api/v1/challenges", tags=["Daily Challenge"])
app.include_router(threat_model_router, prefix="/api/v1/threat-model", tags=["Threat Model"])
app.include_router(profile_routes_router, prefix="/api/v1", tags=["Profile"])
app.include_router(defense_router, prefix="/api/v1/owasp", tags=["OWASP Defense"])
app.include_router(lab_router, prefix="/api/v1", tags=["Attack Labs"])
# ── AI Security Assistant (Module 5.1) ─────────────────────────────────────
app.include_router(ai_chat_router, prefix="/api/v1/chat", tags=["AI Security Assistant"])
# ── AI Code Review (Module 5.3) ────────────────────────────────────────────
app.include_router(code_review_router, prefix="/api/v1/code-review", tags=["AI Code Review"])
# ── AI Remediation Engine (Module 5.4) ─────────────────────────────────────
app.include_router(remediation_router, prefix="/api/v1/remediation", tags=["AI Remediation"])
# ── AI Security Copilot (Module 5.5) ───────────────────────────────────────
app.include_router(security_copilot_router, prefix="/api/v1/copilot", tags=["AI Security Copilot"])
# ── Security Hardening Checklist (Module 6.1) ───────────────────────────────
app.include_router(checklist_router, tags=["Security Checklist"])
# ── AI-Powered Dynamic Checklist (Module 6.2) ──────────────────────────────
app.include_router(ai_checklist_router, tags=["AI Checklist"])
# ── Compliance Center (Module 6.3) ─────────────────────────────────────────
app.include_router(compliance_router, tags=["Compliance Center"])


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
    # Seed the default security hardening checklist catalogue (Module 6.1)
    try:
        from app.services.checklist_service import seed_checklists
        seeded = await seed_checklists()
        print(f"Security checklist catalogue ready ({seeded} items).")
    except Exception as e:
        print(f"Failed to seed security checklists: {e}")

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


# ── Static files (avatars / uploads) ────────────────────────────────────────
import os
from fastapi.staticfiles import StaticFiles

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_UPLOADS_DIR = os.path.join(_BASE_DIR, "uploads")
os.makedirs(os.path.join(_UPLOADS_DIR, "profile"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_UPLOADS_DIR), name="uploads")
