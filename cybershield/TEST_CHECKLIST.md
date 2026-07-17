# CyberShield — Manual Test Checklist (Full Stack)

**Scope:** Phases 2–5 + Final System Testing (both Frontend UI and Backend API).
**How to use:** For each row, perform the action in the UI, then verify the Expected result. Mirror the same case against the backend endpoint (curl/Postman) and mark Pass/Fail. Note any gap in the "Notes" column.

**Legend:** ✅ Pass · ❌ Fail · ⚠️ Partial/N/A · ⬜ Not run
**Backend base URL (local):** `http://localhost:8000/api/v1`
**Frontend base URL (local):** `http://localhost:5173` (or whatever Vite dev port)

> Known preconditions (from code review):
> - Most features require a valid JWT — login first, copy the `token` from localStorage.
> - `Quiz` questions are a **static set** (`app/data/questions.py`), randomly sampled to 10. Not AI-generated.
> - `OWASP Simulator` and the `scan_routes` security-scan pipeline currently use **rule-based / simulated** data (not live engines).
> - Frontend API + WebSocket URLs are **hardcoded to localhost**; change `src/api/api.js` and `src/services/scanService.js` for a deployed backend.
> - Defense Mode (`app/routers/defense_routes.py`) and Attack Labs use **in-memory** stores — data does not persist across restarts.

---

## PHASE 2 — Security Learning Modules

### 2.1 Quiz Testing

| # | Test Case | Frontend (UI) | Backend Endpoint / Service | Expected | ✅/❌ | Notes |
|---|-----------|---------------|----------------------------|----------|------|-------|
| Q1 | Question generation — open quiz | `/quiz` → `src/pages/Quiz/Quiz.jsx` | `POST /api/v1/quiz/start` → `start_quiz` (`app/routes/quiz_routes.py`), then `GET /api/v1/quiz/questions/{session_id}` | 10 random questions displayed | | |
| Q2 | Refresh yields new questions | Reload `/quiz` / click "New Quiz" | Re-call `start` → `get_questions` (random sample of `QUESTIONS`) | New set of questions appears | | |
| Q3 | Submit correct answer → score increases | Answer a question correctly, submit | `POST /api/v1/quiz/submit` → `submit_quiz` (exact-match vs `answer`) | Score increases, percentage computed | | |
| Q4 | Wrong answer → correct answer shown | Answer incorrectly, submit | `submit_quiz` returns `correct_answer` | Correct answer revealed | | |
| Q5 | Wrong answer → explanation shown | Same as Q4 | `submit_quiz` returns `explanation` (from `QUESTIONS`) | Explanation displayed | | |
| Q6 | DB: quiz_attempts stored | Check DB after submit | Writes to `quiz_attempts` (`user_id`, `score`, `answers`, `date`) via `quiz_model` | Document stored with all 4 fields | | |

**Backend-only checks (curl):**
```bash
# Start a quiz session (returns session_id)
curl -X POST http://localhost:8000/api/v1/quiz/start \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{}'

# Get questions
curl http://localhost:8000/api/v1/quiz/questions/<SESSION_ID> \
  -H "Authorization: Bearer <TOKEN>"

# Submit
curl -X POST http://localhost:8000/api/v1/quiz/submit \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"session_id":"<SESSION_ID>","answers":[{"question_id":1,"selected":0}]}'

# History / progress
curl http://localhost:8000/api/v1/quiz/history -H "Authorization: Bearer <TOKEN>"
curl http://localhost:8000/api/v1/quiz/progress -H "Authorization: Bearer <TOKEN>"
```

### 2.2 Glossary Testing

| # | Test Case | Frontend (UI) | Backend Endpoint / Service | Expected | ✅/❌ | Notes |
|---|-----------|---------------|----------------------------|----------|------|-------|
| G1 | Search "SQL Injection" → definition | `/glossary` → `src/pages/Glossary/Glossary.jsx` | `GET /api/v1/glossary/search?term=SQL%20Injection` → `search_glossary` (`app/routes/glossary_routes.py`), data from `app/data/glossary.py` | Definition displayed | | |
| G2 | Flashcard mode — Front: term | Glossary flashcard toggle | `GET /api/v1/glossary/` (full list) + `get_glossary_progress` | Front shows "SQL Injection" | | ⚠️ No dedicated flashcard service; UI must implement front/back toggle from list |
| G3 | Flashcard mode — Back: explanation | Same | Same | Back shows explanation | | |

**Backend-only checks:**
```bash
curl "http://localhost:8000/api/v1/glossary/search?term=SQL%20Injection"
curl "http://localhost:8000/api/v1/glossary/"
curl "http://localhost:8000/api/v1/glossary/progress" -H "Authorization: Bearer <TOKEN>"
```

### 2.3 OWASP Simulator Testing

| # | Test Case | Frontend (UI) | Backend Endpoint / Service | Expected | ✅/❌ | Notes |
|---|-----------|---------------|----------------------------|----------|------|-------|
| O1 | SQLi payload `' OR 1=1 --` | `/owasp` → `OwaspSimulator.jsx` | `POST /api/v1/owasp/simulate/sqli` → `simulate_sqli` (matches `sqli_patterns`) | Attack detected + defense triggered | | |
| O2 | XSS payload `<script>alert(1)</script>` | Same | `POST /api/v1/owasp/simulate/xss` → `simulate_xss` (matches `xss_patterns`) | Blocked | | |
| O3 | Command Injection `; ls` | Same | `POST /api/v1/owasp/simulate/cmdi` → `simulate_cmdi` (delimiters `;`/`&&`/`||`) | Detected | | |
| O4 | (Extra) Path Traversal `../` | Same | `POST /api/v1/owasp/simulate/path-traversal` → `simulate_path_traversal` | Detected | | |
| O5 | Simulation persisted | Check DB | Writes to `owasp_simulations` via `save_simulation()` | Record stored | | |

**Backend-only checks:**
```bash
curl -X POST http://localhost:8000/api/v1/owasp/simulate/sqli \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"payload":"'"'"' OR 1=1 -- "}'

curl -X POST http://localhost:8000/api/v1/owasp/simulate/xss \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"payload":"<script>alert(1)</script>"}'

curl -X POST http://localhost:8000/api/v1/owasp/simulate/cmdi \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"payload":"; ls"}'
```

> Also exercise **Defense Mode** (`/owasp` → `OWASPDefenseMode.jsx`) and **Attack Labs** (`/owasp` → `OWASPLabs.jsx` / `InteractiveLabs.jsx`) — backed by `app/routers/defense_routes.py` (in-memory) and `app/services/attack_lab_service.py`.

---

## PHASE 3 — GitHub Security Scanner

### 3.1 Repository Scan Testing

| # | Test Case | Frontend (UI) | Backend Endpoint / Service | Expected | ✅/❌ | Notes |
|---|-----------|---------------|----------------------------|----------|------|-------|
| S1 | Scan `https://github.com/OWASP/WebGoat` | `/security-scanner` → `GitHubScanner.jsx` / `SecurityScan.jsx` | `POST /api/v1/github/scan-repository` → `scan_repository` (`app/routes/github_routes.py`) using PyGithub + `app/services/github_scanner.py` | Repo cloned, files scanned, issues detected, report generated | | |
| S2 | Scan history listed | `/scan-history` → `GitHubScanHistory.jsx` | `GET /api/v1/github/scan-history` → `get_scan_history` | Past scans shown | | |
| S3 | Reports listed | `/threat-reports` area | `GET /api/v1/github/reports` → `get_reports` | Reports shown | | |

**Backend-only checks:**
```bash
curl -X POST http://localhost:8000/api/v1/github/scan-repository \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"repo_url":"https://github.com/OWASP/WebGoat"}'

curl http://localhost:8000/api/v1/github/scan-history -H "Authorization: Bearer <TOKEN>"
curl http://localhost:8000/api/v1/github/reports -H "Authorization: Bearer <TOKEN>"
```

### 3.2 Vulnerability Detection Testing

Create test repo `test-security` with the payloads below, then scan it.

| # | Test Case | Payload | Backend Service (expected detection) | Expected | ✅/❌ | Notes |
|---|-----------|---------|--------------------------------------|----------|------|-------|
| V1 | Hardcoded secret | `API_KEY="123456"` | `app/services/secret_scanner.py` (`SECRET_PATTERNS`) / `github_scanner.scan_file_content` | Hardcoded Secret, Severity: High | | |
| V2 | Dangerous function (Python) | `eval(user_input)` | `github_scanner.scan_dangerous_code` / `ai_code_review.RULES` (CWE-95) | Code Injection, Critical | | |
| V3 | Dangerous function (JS) | `eval(data)` | `ai_code_review.RULES` | XSS Risk flagged | | |
| V4 | (Extra) other secrets | AWS/GCP/JWT/Mongo URI/private key | `SECRET_PATTERNS` | Detected with category | | |

**Backend-only checks (direct service unit test):**
```bash
# Clone a local copy of test-security, then run scanner against it via the API
curl -X POST http://localhost:8000/api/v1/github/scan-repository \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"repo_url":"https://github.com/<you>/test-security"}'
# Inspect returned findings for severity labels High/Critical and types
```

### 3.3 Scan History Testing

| # | Test Case | Frontend (UI) | Backend / Collection | Expected | ✅/❌ | Notes |
|---|-----------|---------------|----------------------|----------|------|-------|
| H1 | `scan_history` contains metadata | `/scan-history` | `github_scans` / `security_scans` collections | Each record has `repository`, `date`, `risk_score`, `findings` | | |

### 3.4 Advanced Scanner Testing

| # | Test Case | Frontend (UI) | Backend Endpoint / Service | Expected | ✅/❌ | Notes |
|---|-----------|---------------|----------------------------|----------|------|-------|
| A1 | WebSocket progress 10→30→60→100% | `/security-scanner` → `SecurityScan.jsx` opens WS via `scanService.createWebSocketConnection` | `WebSocket /api/v1/scan/security-scan/ws/{scan_id}` (`app/routes/scan_routes.py` `ConnectionManager`) | Progress ticks update live | | ⚠️ Note: `scan_routes.run_security_scan` currently emits *simulated* vulnerabilities |
| A2 | Export report → Download JSON | Scan result view | `GET /api/v1/scan/security-scan/report/{scan_id}/json` (`get_json_report`) | File downloaded | | |
| A3 | Compare scan (same repo twice) | Compare UI / `scanService.compare` | `POST /api/v1/scan/security-scan/compare` (`compare` route) | New / Fixed vulnerabilities + risk difference | | |

**Backend-only checks:**
```bash
# Start scan, capture scan_id
curl -X POST http://localhost:8000/api/v1/scan/security-scan/start \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"repo_url":"https://github.com/OWASP/WebGoat"}'

# WebSocket progress (use wscat or browser)
wscat -c ws://localhost:8000/api/v1/scan/security-scan/ws/<SCAN_ID>

# JSON report
curl http://localhost:8000/api/v1/scan/security-scan/report/<SCAN_ID>/json \
  -H "Authorization: Bearer <TOKEN>" -o report.json
```

> Note: frontend `scanService.js` WS URL is hardcoded `ws://localhost:8000/api/v1/scan/security-scan/ws/${scanId}`.

---

## PHASE 4 — AI Threat Modeling

### 4.1 Threat Input Testing

| # | Test Case | Frontend (UI) | Backend Endpoint / Service | Expected | ✅/❌ | Notes |
|---|-----------|---------------|----------------------------|----------|------|-------|
| T1 | Input Project: Bank API, Tech: FastAPI+MongoDB, Surface: Login/Payment/DB | `/threat-analysis` → `ThreatModeling.jsx` | `POST /api/v1/threat-model/create` → `create_threat_model_endpoint` (`app/routes/threat_model_routes.py`) → `threat_model_service.create_threat_model` | Threat model generated | | |

**Backend-only check:**
```bash
curl -X POST http://localhost:8000/api/v1/threat-model/create \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"project_name":"Bank API","technologies":["FastAPI","MongoDB"],
       "attack_surface":["Login","Payment API","Database"]}'
```

### 4.2 STRIDE Testing

| # | Test Case | Frontend (UI) | Backend Service | Expected | ✅/❌ | Notes |
|---|-----------|---------------|-----------------|----------|------|-------|
| ST1 | All 6 STRIDE categories present | `/threat-dashboard` → `STRIDERadar.jsx` | `app/services/threat_dashboard_service.py::_build_stride` (Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege) | Generated threats cover all 6 | | |

### 4.3 OWASP Mapping Testing

| # | Test Case | Frontend (UI) | Backend Service | Expected | ✅/❌ | Notes |
|---|-----------|---------------|-----------------|----------|------|-------|
| OM1 | SQL Injection → OWASP A03 Injection | `/threat-dashboard` → `OWASPChart.jsx` | `threat_dashboard_service.py::_build_owasp` (`OWASP_TOP_10` A01–A10) | Threat mapped to A03 | | |

### 4.4 AI Report Testing

| # | Test Case | Frontend (UI) | Backend Endpoint | Expected | ✅/❌ | Notes |
|---|-----------|---------------|------------------|----------|------|-------|
| R1 | Report contains Risk Level, Threats, Impact, Recommendations | `/threat-reports` → `ReportViewer.jsx`, `SecurityReport.jsx` | `GET /api/v1/report/{project_id}` (PDF), `GET /api/v1/report/{project_id}/preview`, or `/api/v1/threat-dashboard/{report_id}` | All sections present | | ⚠️ Two routers both define `/report/{project_id}` (collision risk) |
| R2 | PDF export works | Download button in `SecurityReport.jsx` | `generate_pdf_report` (`app/services/pdf_generator.py`) | PDF downloaded/previewed | | |

### 4.5 Collaboration Testing

| # | Test Case | Frontend (UI) | Backend Endpoint / Service | Expected | ✅/❌ | Notes |
|---|-----------|---------------|----------------------------|----------|------|-------|
| C1 | Create project "Shopping API" | `/projects` → `Projects.jsx` | `POST /api/v1/projects` (`project_routes.py`) | Project created | | |
| C2 | Invite user + roles Owner/Developer/Viewer | `/projects/:id/members` → `TeamMembers.jsx` | `POST /api/v1/projects/{id}/members`, `GET .../members` | Roles assignable & listed | | |
| C3 | Comment stored | Project detail comment box | `POST /api/v1/projects/{id}/reports/{report_id}/comments` | Comment persisted | | |
| C4 | Versioning — two reports, compare | `/projects/:id/versions` → `VersionHistory.jsx`, `VersionCompare.jsx` | `POST /api/v1/projects/{id}/compare`, `/reports/{version}` | Improved / New / Fixed issues shown | | |

**Backend-only checks:**
```bash
curl -X POST http://localhost:8000/api/v1/projects \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"name":"Shopping API","description":"Demo"}'

curl -X POST http://localhost:8000/api/v1/projects/<PID>/members \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"user_id":"<UID>","role":"developer"}'

curl http://localhost:8000/api/v1/projects/<PID>/members -H "Authorization: Bearer <TOKEN>"
```

---

## PHASE 5 — AI Security Assistant

### 5.1 Basic AI Chat Testing

| # | Test Case | Frontend (UI) | Backend Endpoint / Service | Expected | ✅/❌ | Notes |
|---|-----------|---------------|----------------------------|----------|------|-------|
| A1 | "What is SQL Injection?" → AI response | `/ai-assistant` → `AIChat.jsx` / `SecurityCopilot.jsx` | `POST /api/v1/chat/message` (`ai_chat_routes.py`) → `ai_chat_service.send_to_gemini` | AI responds (requires Gemini key) | | ⚠️ Needs `GEMINI_API_KEY` set; else fallback/error |

**Backend-only check:**
```bash
curl -X POST http://localhost:8000/api/v1/chat/new \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"title":"test"}'   # returns conversation_id

curl -X POST http://localhost:8000/api/v1/chat/message \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"conversation_id":"<CID>","message":"What is SQL Injection?"}'
```

### 5.2 Context-Aware Testing

| # | Test Case | Frontend (UI) | Backend Service | Expected | ✅/❌ | Notes |
|---|-----------|---------------|-----------------|----------|------|-------|
| A2 | Select Project "Shopping API" + Context "GitHub Scanner", ask "Explain my latest vulnerabilities" | `ContextSelector.jsx` + chat | `context_service.build_context` (`app/services/context_service.py`) pulls latest scan/threat_report/owasp; `prompt_builder.build_context_prompt` | AI uses scan data in answer | | |

### 5.3 AI Code Review Testing

| # | Test Case | Frontend (UI) | Backend Endpoint / Service | Expected | ✅/❌ | Notes |
|---|-----------|---------------|----------------------------|----------|------|-------|
| A3 | Input `password="admin123"` | `/code-review` → `CodeReview.jsx` (CodeEditor) | `POST /api/v1/code-review` → `code_review_service.review_code` + `ai_code_review.scan_rules` (`hardcoded_secret` rule) | AI: Hardcoded credential, Severity High, Recommendation | | |

**Backend-only check:**
```bash
curl -X POST http://localhost:8000/api/v1/code-review \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"code":"password=\"admin123\"","language":"python"}'
```

### 5.4 AI Remediation Testing

| # | Test Case | Frontend (UI) | Backend Endpoint / Service | Expected | ✅/❌ | Notes |
|---|-----------|---------------|----------------------------|----------|------|-------|
| A4 | Input vulnerability "SQL Injection" | `AIRecommendations.jsx` / remediation UI | `POST /api/v1/remediation/generate` → `remediation_service.generate_fix` (`remediation_engine.build_remediation_prompt`) | Generates: Problem explanation, Secure code, Best practices | | |

**Backend-only check:**
```bash
curl -X POST http://localhost:8000/api/v1/remediation/generate \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"vulnerability_type":"SQL Injection","code":"query = \"SELECT * FROM users WHERE id=\"+uid"}'
```

### 5.5 AI Memory Testing

| # | Test Case | Frontend (UI) | Backend Service | Expected | ✅/❌ | Notes |
|---|-----------|---------------|-----------------|----------|------|-------|
| A5 | "Explain XSS" → answer → "How to prevent it?" (follow-up) | `AIChat.jsx` | `ai_chat_service` stores `conversations`+`messages`; memory via `memory_service` (legacy copilot) / `_active_context` | AI understands context of follow-up | | ⚠️ Two chat systems exist (new `/chat`, legacy `/copilot`+`/chatbot`) — verify which the UI actually uses |

---

## FINAL SYSTEM TESTING

### 1. User Journey Test (end-to-end)

| Step | Action | Frontend | Backend | ✅/❌ | Notes |
|------|--------|----------|---------|------|-------|
| 1 | Register | `/register` → `Register.jsx` | `POST /api/v1/auth/register` | | |
| 2 | Login | `/login` → `Login.jsx` | `POST /api/v1/auth/login` (JWT + refresh) | | |
| 3 | Create Project | `/projects` | `POST /api/v1/projects` | | |
| 4 | Run GitHub Scan | `/security-scanner` | `POST /api/v1/github/scan-repository` | | |
| 5 | Generate Threat Model | `/threat-analysis` | `POST /api/v1/threat-model/create` | | |
| 6 | Open AI Assistant, ask about vulnerability | `/ai-assistant` | `POST /api/v1/chat/message` | | |
| 7 | Complete Quiz | `/quiz` | `POST /api/v1/quiz/submit` | | |
| 8 | Check Progress | `/progress` → `Progress.jsx` | `GET /api/v1/dashboard/{user_id}`, `/api/v1/achievements/{user_id}` | | |
| — | **Everything works together** | | | | |

### 2. Performance Testing

| # | Test Case | Method | Expected | ✅/❌ | Notes |
|---|-----------|--------|----------|------|-------|
| P1 | Large repository (1000+ files) | Scan a big public repo via `scan-repository` | No crash, completes (note scan time) | | ⚠️ GitHub API rate limits may apply |
| P2 | 100 concurrent users | `hey`/`artillery`/`locust` against key endpoints (login, scan, chat) | API responds; check DB latency | | |

```bash
# Example load test with hey (install: go install github.com/rakyll/hey@latest)
hey -n 1000 -c 100 -m POST -H "Authorization: Bearer <TOKEN>" \
  -d '{"repo_url":"https://github.com/OWASP/WebGoat"}' \
  http://localhost:8000/api/v1/github/scan-repository
```

### 3. Security Testing

| # | Test Case | Tool / Endpoint | Expected | ✅/❌ | Notes |
|---|-----------|-----------------|----------|------|-------|
| SE1 | XSS / CSRF / Broken Auth | OWASP ZAP against frontend+API | No high-risk findings | | |
| SE2 | JWT validation | Send tampered/expired token to any `/api/v1/*` | 401 rejected | | |
| SE3 | Rate limiting | Hammer `POST /api/v1/auth/login` | Requests throttled after N attempts | | ⚠️ Verify rate-limit middleware exists |
| SE4 | Input validation | Send malformed bodies | 422 / rejected, no 500 | | |

### 4. Database Testing

Verify these MongoDB collections exist and behave correctly:

| Collection | Verified by | Check | ✅/❌ | Notes |
|------------|-------------|-------|------|-------|
| `users` | `user_repository.py` | User doc created on register | | |
| `projects` | `project_service.py` | Project + members persist | | |
| `scans` / `github_scans` / `security_scans` | `scan_repository.py` | Scan records + findings | | |
| `reports` / `security_reports` / `threat_reports` | `report_routes.py` | Report docs present | | |
| `quiz_attempts` | `quiz_model.py` | Attempts with user_id/score/answers/date | | |
| `conversations` + `messages` | `chat_repository.py` | AI chat history | | |
| `audit_logs` | `audit_repository.py` | Audit events logged | | |

**Additional DB checks:** data consistency (refs resolve), duplicate prevention (unique indexes on `users.email`, etc.), indexing (compound indexes on frequently-queried fields).

```bash
# Using mongosh
use cybershield
show collections
db.users.countDocuments()
db.quiz_attempts.findOne({})
db.conversations.aggregate([{$lookup:{from:"messages",localField:"_id",foreignField:"conversation_id",as:"msgs"}}])
```

### 5. Deployment Testing

| # | Test Case | Command / Action | Expected | ✅/❌ | Notes |
|---|-----------|------------------|----------|------|-------|
| D1 | Backend production mode | `uvicorn app.main:app --env-file .env.prod` (or Docker) | Starts without dev reload | | |
| D2 | Frontend production build | `cd frontend && npm run build` | Build succeeds, no errors | | |
| D3 | Login in prod build | Prod frontend → login | Works | | |
| D4 | Scanner in prod build | Prod frontend → run scan | Works | | |
| D5 | AI in prod build | Prod frontend → assistant | Works | | |
| D6 | Reports in prod build | Prod frontend → view report | Works | | |
| D7 | Dashboard in prod build | Prod frontend → dashboard | Works | | |

---

## Final Acceptance Checklist

| Module | Status |
|--------|--------|
| Environment Setup | ✅ |
| Authentication | ✅ |
| Dashboard | ✅ |
| Quiz | ⬜ |
| Glossary | ⬜ |
| OWASP Simulator | ⬜ |
| GitHub Scanner | ⬜ |
| Threat Modeling | ⬜ |
| Collaboration | ⬜ |
| AI Assistant | ⬜ |
| Reports | ⬜ |
| Security Testing | ⬜ |
| Deployment Testing | ⬜ |

---

## Known Gaps / Risks Found During Mapping (carry into testing)

1. **Quiz questions are static** (`app/data/questions.py`) — "random" = random sample, not AI-generated. Confirm 10-question count holds.
2. **OWASP Simulator & `scan_routes` security-scan are simulated/rule-based** — detection works on regex patterns, but the advanced scanner pipeline emits *simulated* vulnerabilities. Validate what's real vs mocked.
3. **Two routers both define `GET /report/{project_id}`** (`report_routes.py` + `threat_report_routes.py`) — possible route collision depending on include order.
4. **Copilot prefix collision** — new `app/api/copilot_routes.py` and legacy `app/routers/copilot_routes.py` both mount `/api/v1/copilot`.
5. **Defense Mode & Attack Labs use in-memory stores** — data lost on restart; not in DB.
6. **Frontend URLs hardcoded to localhost** — `src/api/api.js` (API base) and `src/services/scanService.js` (WebSocket) must be updated for deployed backend.
7. **LearningDashboard certificate download is a stub** — not wired to a real endpoint.
8. **Two AI chat systems exist** (new `/chat` + legacy `/copilot` & `/chatbot`) — confirm which the UI uses for memory tests (5.5).
9. **Gemini dependency** — Phases 4/5 AI features require `GEMINI_API_KEY`; otherwise expect fallback/errors.
