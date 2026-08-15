from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app.config.settings import settings
from app.routes.auth_routes import router as auth_router
from app.routes.onboarding_routes import router as onboarding_router
from app.routes.security_routes import router as security_router
from app.routes.scan_routes import router as scan_router
from app.routes.github_routes import router as github_router
from app.github.routes import router as github_analysis_router
from app.api.routes.github_history import router as github_history_router
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
from app.api.owasp_routes import router as owasp_module_router
from app.api.achievement_routes import router as gamification_router
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
from app.routes.notification_routes import router as notification_router
from app.services.scheduler import scheduler
from app.services.monitoring_jobs import monitor_targets
from app.routes.scheduler_routes import router as automation_router
from app.services.scheduler_service import register_scheduler_jobs
from app.dashboard.routes import router as dashboard_module_router
from app.routes.dashboard_routes import router as dashboard_aggregator_router
from app.websocket.dashboard_ws import router as dashboard_ws_router
from app.ai.routes import router as ai_dashboard_router
from app.ai.vulnerability_routes import router as vulnerability_ai_router
from app.scanner.routes import router as scanner_router
from app.scanner.websocket import router as scanner_ws_router
from app.scanner.worker import start_worker
from app.scanner.findings_routes import router as findings_router
from app.rules.rule_routes import router as rule_mapping_router
from app.recommendation.routes import router as recommendation_router
from app.sc5.routes import router as sc5_router
from app.reports.routes import router as professional_reports_router
from app.ai_assistant.routes import router as ai_assistant_router
from app.learning.learning_routes import router as learning_router
from app.ai.summary_routes import router as summary_router


# ── App instance ─────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for CyberShield Final Year Project",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Proxy headers (needed behind Render / any reverse proxy) ────────────────
# Trust X-Forwarded-Proto / X-Forwarded-Host so request.base_url returns the
# correct external URL (e.g. https://final-year-project-id8d.onrender.com).
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://final-year-project-fjgf.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(onboarding_router, prefix="/api/v1/onboarding", tags=["Onboarding"])
app.include_router(session_router, prefix="/api/v1/auth", tags=["Sessions"])
app.include_router(security_router, prefix="/api/v1/security", tags=["Security Analyzer"])
app.include_router(scan_router, prefix="/api/v1/scan", tags=["Scan"])
app.include_router(github_router, prefix="/api/v1/github", tags=["GitHub Scanner"])
app.include_router(github_analysis_router, prefix="/api/v1/github", tags=["GitHub Analysis"])
app.include_router(github_history_router, prefix="/api/v1/github", tags=["History"])
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
# Module 7.4 OWASP Simulator (labs/start/attack/defense/daily/history/progress)
app.include_router(owasp_module_router)
# Module 7.5 Gamification (progress/achievements/badges/certificates/leaderboard/activity/goals)
app.include_router(gamification_router)
# ── Dashboard Architecture (Module C1 & C2) ────────────────────────────────
# Registered BEFORE progress_router so its STATIC paths (/overview, "", /quick-stats)
# are matched before progress_router's catch-all /dashboard/{user_id} route.
app.include_router(dashboard_module_router, prefix="", tags=["Dashboard"])
app.include_router(dashboard_module_router, prefix="/api", tags=["Dashboard"])
app.include_router(dashboard_module_router, prefix="/api/v1", tags=["Dashboard"])
app.include_router(dashboard_aggregator_router, prefix="/api/v1", tags=["Dashboard Aggregator"])
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
# ── AI Security Assistant (Module E1) ──────────────────────────────────────
app.include_router(ai_assistant_router, prefix="/api/v1", tags=["AI Security Assistant E1"])
# ── AI Learning Recommendations (Module E2) ───────────────────────────────
app.include_router(learning_router, prefix="/api/v1", tags=["Learning Recommendations"])
# ── AI Scan Summary (Module E3) ───────────────────────────────────────────
app.include_router(summary_router, prefix="/api/v1", tags=["AI Scan Summary"])
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
# ── Notifications (Module 6.5) ───────────────────────────────────────────────
app.include_router(notification_router, tags=["Notifications"])
# ── Security Notifications, Automation & Scheduled Monitoring (Module 6.5) ──
app.include_router(automation_router, tags=["Automation & Scheduler"])
# ── Real-time WebSocket (Module C3) ────────────────────────────────────────
app.include_router(dashboard_ws_router, tags=["WebSocket"])
# ── AI Dashboard (Module D1) ────────────────────────────────────────────────
app.include_router(ai_dashboard_router, prefix="/api/v1", tags=["AI Dashboard"])
# ── AI Vulnerability Explanation (Module D4) ───────────────────────────────
app.include_router(vulnerability_ai_router, prefix="/api/v1", tags=["AI Vulnerability"])
# ── Real-Time Scan Engine (Module D3) ────────────────────────────────────────
app.include_router(scanner_router, prefix="/api/v1/scanner", tags=["Scan Engine"])
app.include_router(scanner_ws_router, tags=["Scanner WebSocket"])
# ── SAST Findings (Module D6) ────────────────────────────────────────────────
app.include_router(findings_router, prefix="/api/v1/scanner", tags=["Scan Findings"])
# ── Rule Mapping Engine (Module SC2) ────────────────────────────────────────
app.include_router(rule_mapping_router, tags=["Rule Mapping"])
# ── Auto Recommendation Service (Module SC3) ─────────────────────────────────
app.include_router(recommendation_router, tags=["Scanner Recommendations"])
# ── SC5: AI-Assisted Recommendations & Score Tracking ─────────────────────────
app.include_router(sc5_router, tags=["SC5 AI Recommendations"])
# ── Professional Security Reports (Module D5) ────────────────────────────────
app.include_router(professional_reports_router, prefix="/api/v1/reports", tags=["Professional Reports"])

from fastapi import WebSocket, WebSocketDisconnect
from app.websocket.manager import manager as _ws_manager

@app.websocket("/ws/dashboard")
async def root_ws_dashboard(websocket: WebSocket):
    """Root-level /ws/dashboard — delegates to the shared ConnectionManager."""
    token: str = websocket.query_params.get("token", "")
    await _ws_manager.connect(websocket)
    try:
        await websocket.send_json({
            "event": "connected",
            "message": "Real-time dashboard stream connected",
        })
        while True:
            await websocket.receive_text()
            await websocket.send_json({"event": "pong"})
    except (WebSocketDisconnect, Exception):
        await _ws_manager.disconnect(websocket)




# ── Global Error Handler (Module E5, Part 8) ────────────────────────────────
@app.exception_handler(Exception)
async def global_error_handler(request: Request, exc: Exception):
    """Catch-all handler — returns a consistent JSON error for any unhandled exception."""
    print(f"[Error] {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "Something went wrong. Please try again later.",
        },
    )


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
    # MongoDB connection verification — fail fast so data can never be
    # silently written to an unreachable database.
    try:
        from app.database.db import database
        await database.command("ping")
        print(f"MongoDB connection verified: {database.name}")
    except Exception as e:
        print(f"CRITICAL: MongoDB connection failed at startup: {e}")

    # Seed the default security hardening checklist catalogue (Module 6.1)
    try:
        from app.services.checklist_service import seed_checklists
        seeded = await seed_checklists()
        print(f"Security checklist catalogue ready ({seeded} items).")
    except Exception as e:
        print(f"Failed to seed security checklists: {e}")

    # H7.1: Create indexes for scan_history collection
    try:
        from app.services.history_service import create_indexes
        await create_indexes()
        print("Scan history indexes created successfully.")
    except Exception as e:
        print(f"Failed to create scan history indexes: {e}")

    # Module E5, Part 4: Ensure all MongoDB indexes for performance
    try:
        from app.database.indexes import ensure_indexes
        await ensure_indexes()
    except Exception as e:
        print(f"Failed to ensure MongoDB indexes: {e}")

    # Add scheduled jobs
    scheduler.add_job(
        monitor_targets,
        "interval",
        minutes=30
    )
    # Register Module 6.5 automation / notification jobs
    register_scheduler_jobs()
    # Start the scan worker
    await start_worker()
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

# Upload writers (e.g. user_service.py) save relative to the backend directory,
# so serve "/uploads" from cybershield/backend/uploads — NOT the repo-root uploads.
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_UPLOADS_DIR = os.path.join(_BACKEND_DIR, "uploads")
os.makedirs(os.path.join(_UPLOADS_DIR, "profile"), exist_ok=True)
os.makedirs(os.path.join(_UPLOADS_DIR, "reports"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_UPLOADS_DIR), name="uploads")
