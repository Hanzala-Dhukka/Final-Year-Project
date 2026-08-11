import { useState, Fragment } from "react"
import { useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaRocket,
  FaDatabase,
  FaCode,
  FaServer,
  FaLightbulb,
  FaFileAlt,
  FaSpinner,
  FaChevronDown,
  FaChevronRight,
  FaBug,
  FaUserShield,
  FaCloud,
  FaPlug,
  FaBoxes,
  FaTimes,
  FaSearch,
  FaRedo,
} from "react-icons/fa"
import { createThreatModel } from "../../api/threatApi"
import "../SecurityScanner/GitHubScanner.css"

const RISK_STYLES = {
  Critical: { badge: "gs-badge-critical", color: "#ef4444", bg: "#ef444415" },
  High:     { badge: "gs-badge-high",     color: "#f97316", bg: "#f9731615" },
  Medium:   { badge: "gs-badge-medium",   color: "#eab308", bg: "#eab30815" },
  Low:      { badge: "gs-badge-low",      color: "#22c55e", bg: "#22c55e15" },
}

const TABS = [
  { id: "overview", label: "Overview", icon: FaSearch },
  { id: "threats",  label: "Threats",  icon: FaBug },
  { id: "fix",      label: "Fix Plan", icon: FaLightbulb },
  { id: "report",   label: "Report",   icon: FaFileAlt },
]

const EMPTY_FORM = {
  project_name: "",
  description: "",
  frontend: "",
  backend: "",
  database: "",
  authentication: "",
  cloud: "",
  third_party: "",
  assets: "",
}

/* ── Auto-fill from a linked project (Run Analysis) ───── */
const norm = (s) => (s || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "")

const TECH_CATEGORIES = {
  frontend: new Set([
    "react", "vue", "angular", "svelte", "nextjs", "next", "nuxt", "gatsby",
    "html", "css", "javascript", "js", "typescript", "ts", "tailwind",
    "bootstrap", "redux", "jquery", "ember", "solidjs", "remix", "sass",
    "webpack", "vite", "flutter", "reactnative", "electron",
  ]),
  backend: new Set([
    "fastapi", "node", "nodejs", "express", "django", "flask", "spring",
    "springboot", "laravel", "rails", "rubyonrails", "go", "golang",
    "python", "java", "csharp", "net", "aspnet", "nestjs", "php", "gin",
    "ktor", "elixir", "phoenix", "graphql", "kotlin", "rust", "scala",
    "fastify", "djangorest", "ruby", "perl",
  ]),
  database: new Set([
    "mongodb", "mongo", "postgres", "postgresql", "mysql", "sqlite",
    "redis", "cassandra", "dynamodb", "mariadb", "oracle", "sqlserver",
    "mssql", "firebase", "elasticsearch", "neo4j", "supabase", "prisma",
    "cockroachdb", "clickhouse", "influxdb", "bigquery", "drizzle",
  ]),
  authentication: new Set([
    "jwt", "oauth", "oauth2", "oauth20", "keycloak", "auth0", "saml",
    "session", "apikey", "firebaseauth", "passport", "ldap", "cas", "mfa", "2fa",
  ]),
  cloud: new Set([
    "aws", "gcp", "azure", "docker", "kubernetes", "k8s", "heroku",
    "vercel", "netlify", "serverless", "lambda", "ec2", "s3", "terraform",
    "cloudflare", "onpremise", "onprem", "digitalocean", "gke", "eks",
  ]),
  third_party: new Set([
    "stripe", "twilio", "sendgrid", "paypal", "slack", "googlemaps",
    "plaid", "square", "mailchimp", "braintree", "recaptcha",
  ]),
  assets: new Set([
    "pii", "payment", "creditcard", "financial", "health", "phi",
    "personaldata", "credentials", "secret", "banking", "customerdata",
    "tokens", "password",
  ]),
}

// Map a matched tech back to the exact <option> value of the select fields.
const AUTH_SELECT_MAP = {
  jwt: "JWT", oauth: "OAuth2", oauth2: "OAuth2", oauth20: "OAuth2",
  session: "Session", apikey: "API Key", saml: "SAML",
}
const CLOUD_SELECT_MAP = {
  aws: "AWS", gcp: "GCP", azure: "Azure", onpremise: "On-Premise",
  onprem: "On-Premise", docker: "Docker", serverless: "Serverless", lambda: "Serverless",
}

function buildFormFromProject(project) {
  if (!project) return { ...EMPTY_FORM }

  const groups = {
    frontend: [], backend: [], database: [], authentication: [],
    cloud: [], third_party: [], assets: [],
  }
  const techs = Array.isArray(project.tech_stack) ? project.tech_stack : []

  techs.forEach((t) => {
    const key = norm(t)
    if (!key) return
    for (const [cat, keywords] of Object.entries(TECH_CATEGORIES)) {
      if (keywords.has(key) && !groups[cat].includes(t)) {
        groups[cat].push(t)
        break
      }
    }
  })

  const authKey = norm(groups.authentication[0] || "")
  const cloudKey = norm(groups.cloud[0] || "")
  const repoNote = project.repo_url ? `Repository: ${project.repo_url}` : ""

  return {
    project_name: project.name || "",
    description: [project.description, repoNote].filter(Boolean).join("\n"),
    frontend: groups.frontend.join(", "),
    backend: groups.backend.join(", "),
    database: groups.database.join(", "),
    authentication: AUTH_SELECT_MAP[authKey] || "",
    cloud: CLOUD_SELECT_MAP[cloudKey] || "",
    third_party: groups.third_party.join(", "),
    assets: groups.assets.join(", "),
  }
}

/* ── Parse executive_summary text into structured data ───── */
function parseSecurityReport(text) {
  if (!text) return null
  const lines = text.split("\n")
  const sections = { title: "", severity: [], threats: [], general: [] }
  let phase = "header"

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    // Section headers
    if (/^security report for:/i.test(line)) {
      sections.title = line.replace(/^security report for:\s*/i, "")
      phase = "header"
      continue
    }
    if (/^severity summary/i.test(line)) { phase = "severity"; continue }
    if (/^identified threats/i.test(line)) { phase = "threats"; continue }

    // Severity lines: "- critical: 8"
    if (phase === "severity" && /^-\s*\w+:\s*\d+/.test(line)) {
      const m = line.match(/^-\s*(\w+):\s*(\d+)/i)
      if (m) sections.severity.push({ level: m[1], count: parseInt(m[2]) })
      continue
    }

    // Threat lines: "[High] Name (Category)"
    const threatMatch = line.match(/^\[(\w+)\]\s*(.+)/)
    if (threatMatch) {
      const severity = threatMatch[1]
      const rest = threatMatch[2]
      // Extract name and category: "XSS (Application)" → name="XSS", category="Application"
      const catMatch = rest.match(/^(.+?)\s*\((.+?)\)\s*$/)
      sections.threats.push({
        severity,
        name: catMatch ? catMatch[1].trim() : rest.trim(),
        category: catMatch ? catMatch[2].trim() : "",
        fix: "",
      })
      phase = "threat_fix"
      continue
    }

    // Fix lines: "Fix: ..."
    if (phase === "threat_fix" && /^fix:\s*/i.test(line)) {
      const fix = line.replace(/^fix:\s*/i, "")
      if (sections.threats.length > 0) {
        sections.threats[sections.threats.length - 1].fix = fix
      }
      continue
    }

    // General text
    if (phase === "header" && line && !sections.title) {
      sections.general.push(line)
    }
  }

  return sections
}

/* ── Severity color mapping ──────────────────────────────── */
const SEV_COLORS = {
  critical: { color: "#ef4444", bg: "#ef444415", border: "#ef444440" },
  high:     { color: "#f97316", bg: "#f9731615", border: "#f9731640" },
  medium:   { color: "#eab308", bg: "#eab30815", border: "#eab30840" },
  low:      { color: "#22c55e", bg: "#22c55e15", border: "#22c55e40" },
}
function getSevStyle(level) {
  return SEV_COLORS[(level || "").toLowerCase()] || SEV_COLORS.medium
}

/* ── Security Score Ring ──────────────────────────────── */
function ScoreRing({ score = 0, size = 120, stroke = 8 }) {
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ
  const col = score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444"
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        <motion.circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={col} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ}
          strokeLinecap="round"
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: col, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginTop: 2 }}>/100</span>
      </div>
    </div>
  )
}

function FormField({ label, required, icon, children }) {
  return (
    <div>
      <div className="gs-form-label">{icon} {label} {required && <span>*</span>}</div>
      {children}
    </div>
  )
}

/* ── Main Component ───────────────────────────────────── */
export default function ThreatAnalysis() {
  const location = useLocation()
  const linkedProject = location.state?.project || null
  const [state, setState] = useState("idle")
  const [form, setForm] = useState(() => buildFormFromProject(linkedProject))
  const [results, setResults] = useState(null)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [expandedThreat, setExpandedThreat] = useState(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.project_name.trim()) return

    setState("scanning")
    setError("")
    setResults(null)

    const payload = {
      project_name: form.project_name.trim(),
      description: form.description.trim() || "No description provided",
      frontend: form.frontend.trim() || "Not specified",
      backend: form.backend.trim() || "Not specified",
      database: form.database.trim() || "Not specified",
      authentication: form.authentication.trim() || "Not specified",
    }
    if (form.cloud.trim()) payload.cloud = form.cloud.trim()
    if (form.third_party.trim()) payload.third_party = form.third_party.split(",").map(s => s.trim()).filter(Boolean)
    if (form.assets.trim()) payload.assets = form.assets.split(",").map(s => s.trim()).filter(Boolean)

    console.log("[ThreatAnalysis] payload:", payload)

    try {
      const data = await createThreatModel(payload)
      console.log("[ThreatAnalysis] response:", data)
      setResults(data)
      setState("completed")
    } catch (err) {
      console.error("[ThreatAnalysis] error:", err)
      const detail = err.response?.data?.detail
      let msg = "Failed to generate threat analysis."
      if (Array.isArray(detail)) {
        msg = detail.map(d => `${d.loc?.slice(1).join(".") || "field"}: ${d.msg}`).join(" | ")
      } else if (typeof detail === "string") {
        msg = detail
      }
      setError(msg)
      setState("error")
    }
  }

  const resetToIdle = () => {
    setState("idle")
    setResults(null)
    setError("")
    setForm(EMPTY_FORM)
    setActiveTab("overview")
    setExpandedThreat(null)
  }

  /* ════ IDLE ════ */
  if (state === "idle") {
    return (
      <div className="gs-page">
        <div className="gs-empty-state">
          <FaShieldAlt className="gs-empty-icon" />
          <h2>Threat Modeling</h2>
          <p>Enter your project details to generate an AI-powered threat analysis.</p>
        </div>
        {linkedProject && (
          <div style={{
            maxWidth: 700, margin: "20px auto 0",
            display: "flex", alignItems: "center", gap: 10,
            background: "linear-gradient(135deg, rgba(99,102,241,0.13), rgba(139,92,246,0.13))",
            border: "1px solid rgba(99,102,241,0.27)", borderRadius: 12,
            padding: "12px 16px", fontSize: 13, color: "var(--textSecondary)",
          }}>
            <FaRocket style={{ color: "#818cf8", fontSize: 15, flexShrink: 0 }} />
            <span>
              Project <strong style={{ color: "var(--textPrimary)" }}>{linkedProject.name}</strong> loaded — review the auto-filled details below, then click <strong style={{ color: "var(--textPrimary)" }}>Analyze</strong>.
            </span>
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ maxWidth: 700, margin: "32px auto 0" }}>
          <div className="gs-url-bar">
            <div className="gs-url-input-wrap">
              <FaShieldAlt className="gs-url-icon" />
              <input name="project_name" value={form.project_name} onChange={handleChange}
                placeholder="Project name (e.g. CyberShield)" className="gs-url-input" required />
              {form.project_name && (
                <button type="button" className="gs-url-clear" onClick={() => setForm({ ...form, project_name: "" })}>
                  <FaTimes />
                </button>
              )}
            </div>
            <button type="submit" className="gs-btn-primary" disabled={!form.project_name.trim()}>
              <FaSearch /> Analyze
            </button>
          </div>
          <div className="gs-card" style={{ marginTop: 20 }}>
            <div className="gs-card-title"><FaRocket /> Project Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <FormField label="Frontend" required icon={<FaCode />}>
                <input name="frontend" value={form.frontend} onChange={handleChange} placeholder="React, Vue..." className="gs-form-input" />
              </FormField>
              <FormField label="Backend" required icon={<FaServer />}>
                <input name="backend" value={form.backend} onChange={handleChange} placeholder="FastAPI, Node..." className="gs-form-input" />
              </FormField>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <FormField label="Database" required icon={<FaDatabase />}>
                <input name="database" value={form.database} onChange={handleChange} placeholder="MongoDB, PostgreSQL..." className="gs-form-input" />
              </FormField>
              <FormField label="Authentication" required icon={<FaUserShield />}>
                <select name="authentication" value={form.authentication} onChange={handleChange} className="gs-form-input">
                  <option value="">Select method...</option>
                  <option value="JWT">JWT</option>
                  <option value="OAuth2">OAuth 2.0</option>
                  <option value="Session">Session-based</option>
                  <option value="API Key">API Key</option>
                  <option value="SAML">SAML / SSO</option>
                  <option value="None">No Authentication</option>
                </select>
              </FormField>
            </div>
            <FormField label="Description">
              <textarea name="description" value={form.description} onChange={handleChange} rows={2}
                placeholder="Brief project description..." className="gs-form-input" style={{ resize: "none" }} />
            </FormField>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
              <FormField label="Cloud / Deployment" icon={<FaCloud />}>
                <select name="cloud" value={form.cloud} onChange={handleChange} className="gs-form-input">
                  <option value="">Optional...</option>
                  <option value="AWS">AWS</option><option value="GCP">GCP</option>
                  <option value="Azure">Azure</option><option value="On-Premise">On-Premise</option>
                  <option value="Docker">Docker</option><option value="Serverless">Serverless</option>
                </select>
              </FormField>
              <FormField label="Third-Party APIs" icon={<FaPlug />}>
                <input name="third_party" value={form.third_party} onChange={handleChange} placeholder="Stripe, Twilio..." className="gs-form-input" />
              </FormField>
              <FormField label="Sensitive Assets" icon={<FaBoxes />}>
                <input name="assets" value={form.assets} onChange={handleChange} placeholder="PII, Payment data..." className="gs-form-input" />
              </FormField>
            </div>
          </div>
        </form>
        <style>{`
          .gs-form-input{width:100%;padding:10px 12px;background:var(--bg-primary,#0f172a);border:1px solid var(--border-strong,#334155);border-radius:8px;color:var(--textPrimary);font-size:13px;outline:none;transition:border-color .2s}
          .gs-form-input::placeholder{color:#64748b}.gs-form-input:focus{border-color:#6366f1}
          .gs-form-label{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--textSecondary);margin-bottom:6px;text-transform:uppercase;letter-spacing:.3px}
          .gs-form-label svg{font-size:11px;color:#6366f1}.gs-form-label span{color:#ef4444}
        `}</style>
      </div>
    )
  }

  /* ════ SCANNING ════ */
  if (state === "scanning") {
    return (
      <div className="gs-page" style={{ background: "var(--bgPrimary)", minHeight: "100vh", color: "var(--textPrimary)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "linear-gradient(135deg, rgba(99,102,241,0.13), rgba(139,92,246,0.13))",
          border: "1px solid rgba(99,102,241,0.27)", borderRadius: 12,
          padding: "14px 20px", marginBottom: 20, fontSize: 14, fontWeight: 600, color: "var(--textPrimary)",
        }}>
          <FaSpinner className="gs-spin" /> Analyzing threats for {form.project_name}...
        </div>
        <div style={{
          background: "var(--glassBg)", border: "1px solid var(--glassBorder)", borderRadius: 12,
          padding: "60px 24px", textAlign: "center", maxWidth: 700, margin: "0 auto",
        }}>
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
            <FaShieldAlt style={{ fontSize: 48, color: "#6366f1", marginBottom: 20 }} />
          </motion.div>
          <h3 style={{ color: "var(--textPrimary)", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            AI Threat Analysis in Progress
          </h3>
          <p style={{ color: "var(--textSecondary)", fontSize: 14 }}>
            Evaluating project architecture, tech stack, and attack surfaces...
          </p>
        </div>
      </div>
    )
  }

  /* ════ ERROR ════ */
  if (state === "error") {
    return (
      <div className="gs-page" style={{ background: "var(--bgPrimary)", minHeight: "100vh", color: "var(--textPrimary)" }}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: "60vh", textAlign: "center",
        }}>
          <FaExclamationTriangle style={{ fontSize: 40, color: "#ef4444", marginBottom: 16 }} />
          <h2 style={{ color: "#f87171" }}>Analysis Failed</h2>
          <p style={{ color: "var(--textSecondary)", maxWidth: 500, margin: "0 auto 20px", lineHeight: 1.6 }}>{error}</p>
          <button className="gs-btn-primary" onClick={resetToIdle} style={{ marginTop: 12 }}>
            <FaRedo /> Try Again
          </button>
        </div>
      </div>
    )
  }

  /* ════ COMPLETED ════ */
  if (!results) {
    return (
      <div className="gs-page" style={{ background: "var(--bgPrimary)", minHeight: "100vh", color: "var(--textPrimary)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <p style={{ color: "var(--textSecondary)" }}>No results to display.</p>
          <button className="gs-btn-primary" onClick={resetToIdle} style={{ marginTop: 12 }}>
            <FaRedo /> Try Again
          </button>
        </div>
      </div>
    )
  }

  const riskStyle = RISK_STYLES[results.risk_level] || RISK_STYLES.Medium
  const projectName = results.project?.name || form.project_name || "Project"
  const threatsFound = results.threats_found ?? results.threats?.length ?? 0
  const avgScore = results.average_score ?? 0
  const riskSummary = results.risk_summary || {}
  const threats = results.threats || []
  const recommendations = results.recommendations || []
  const fixPlan = results.fix_plan || {}
  const securityReport = results.security_report || {}
  const usedAI = results.used_ai === true

  return (
    <div className="gs-page" style={{ background: "var(--bgPrimary)", minHeight: "100vh", color: "var(--textPrimary)" }}>
      {/* Header */}
      <div className="gs-repo-header">
        <div className="gs-repo-header-left">
          <div className="gs-repo-icon"><FaShieldAlt /></div>
          <div>
            <p className="gs-repo-name">{projectName}</p>
            <p className="gs-repo-desc">{threatsFound} threat{threatsFound !== 1 ? "s" : ""} identified — {usedAI ? "AI-powered analysis" : "Rule-based analysis"}</p>
          </div>
        </div>
        <div className="gs-repo-header-stats">
          <div className="gs-stat-chip">
            <span className={`gs-badge ${riskStyle.badge}`}>{results.risk_level || "Medium"}</span>
          </div>
          {usedAI && (
            <div className="gs-stat-chip" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(99,102,241,0.3)", color: "var(--textPrimary)" }}>
              AI
            </div>
          )}
          <div className="gs-stat-chip">
            Score: <strong style={{ marginLeft: 4 }}>{avgScore}/100</strong>
          </div>
          <button className="gs-btn-primary" onClick={resetToIdle} style={{ padding: "8px 16px", fontSize: 13 }}>
            <FaRocket /> New Analysis
          </button>
        </div>
      </div>

      {/* Severity Grid */}
      <div className="gs-severity-grid">
        {[
          { label: "Critical", count: riskSummary.critical || 0, border: "#ef4444", bg: "#ef444412" },
          { label: "High",     count: riskSummary.high || 0,     border: "#f97316", bg: "#f9731612" },
          { label: "Medium",   count: riskSummary.medium || 0,   border: "#eab308", bg: "#eab30812" },
          { label: "Low",      count: riskSummary.low || 0,      border: "#22c55e", bg: "#22c55e12" },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="gs-severity-card" style={{ borderColor: s.border + "44", background: s.bg }}>
            <span className="gs-severity-label" style={{ color: s.border }}>{s.label}</span>
            <span className="gs-severity-count" style={{ color: s.border }}>{s.count}</span>
          </motion.div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="gs-tabs-bar">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button key={tab.id} className={`gs-tab-btn ${activeTab === tab.id ? "gs-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}>
              <Icon size={14} /><span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="gs-tab-content">
        <AnimatePresence mode="wait">
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, marginBottom: 16 }}>
                <div className="gs-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 32px", minWidth: 160 }}>
                  <ScoreRing score={avgScore} />
                  <p style={{ color: "var(--textSecondary)", fontSize: 12, fontWeight: 600, marginTop: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Security Score</p>
                </div>
                <div className="gs-card gs-card-accent" style={{ marginBottom: 0 }}>
                  <div className="gs-card-title"><FaShieldAlt /> Project Overview</div>
                  <div className="gs-report-meta">
                    <div><span className="gs-report-label">Project</span><span className="gs-report-value">{projectName}</span></div>
                    <div><span className="gs-report-label">Frontend</span><span className="gs-report-value">{results.project?.frontend}</span></div>
                    <div><span className="gs-report-label">Backend</span><span className="gs-report-value">{results.project?.backend}</span></div>
                    <div><span className="gs-report-label">Database</span><span className="gs-report-value">{results.project?.database}</span></div>
                    <div><span className="gs-report-label">Auth</span><span className="gs-report-value">{results.project?.authentication}</span></div>
                    {results.project?.cloud && <div><span className="gs-report-label">Cloud</span><span className="gs-report-value">{results.project?.cloud}</span></div>}
                  </div>
                </div>
              </div>
              <div className="gs-card">
                <div className="gs-card-title"><FaExclamationTriangle /> Risk Summary</div>
                <div className="gs-report-meta">
                  <div><span className="gs-report-label">Overall Risk</span><span className="gs-report-value" style={{ color: riskStyle.color }}>{results.risk_level}</span></div>
                  <div><span className="gs-report-label">Security Score</span><span className="gs-report-value">{avgScore}/100</span></div>
                  <div><span className="gs-report-label">Threats Found</span><span className="gs-report-value">{threatsFound}</span></div>
                  <div><span className="gs-report-label">Top Risk</span><span className="gs-report-value">{results.top_risks?.[0]?.threat || "—"}</span></div>
                </div>
              </div>
              {securityReport.executive_summary && (() => {
                const parsed = parseSecurityReport(securityReport.executive_summary)
                return parsed ? (
                  <div className="gs-card">
                    <div className="gs-card-title"><FaFileAlt /> AI Security Report</div>

                    {/* Severity Summary */}
                    {parsed.severity.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, marginBottom: 16 }}>
                        {parsed.severity.map((s) => {
                          const sc = getSevStyle(s.level)
                          return (
                            <div key={s.level} style={{
                              background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 8,
                              padding: "8px 16px", display: "flex", alignItems: "center", gap: 8,
                            }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: sc.color, flexShrink: 0 }} />
                              <span style={{ color: sc.color, fontWeight: 700, fontSize: 13, textTransform: "capitalize" }}>{s.level}</span>
                              <span style={{ color: "var(--textPrimary)", fontWeight: 800, fontSize: 18 }}>{s.count}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Identified Threats - Numbered List */}
                    {parsed.threats.length > 0 && (
                      <div>
                        <h4 style={{ color: "var(--textPrimary)", fontSize: 14, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                          <FaBug size={13} style={{ color: "#6366f1" }} />
                          Identified Threats ({parsed.threats.length})
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {parsed.threats.map((t, i) => {
                            const sc = getSevStyle(t.severity)
                            return (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                style={{
                                  background: "#0f172a", border: `1px solid ${sc.border}`,
                                  borderRadius: 10, padding: "12px 16px",
                                  display: "flex", flexDirection: "column", gap: 6,
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <span style={{
                                    width: 24, height: 24, borderRadius: 6, background: sc.bg,
                                    border: `1px solid ${sc.border}`, display: "flex", alignItems: "center",
                                    justifyContent: "center", fontSize: 11, fontWeight: 800, color: sc.color,
                                    flexShrink: 0,
                                  }}>
                                    {i + 1}
                                  </span>
                                  <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, flex: 1 }}>
                                    {t.name}
                                  </span>
                                  <span style={{
                                    padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700,
                                    textTransform: "uppercase", letterSpacing: 0.5,
                                    background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                                  }}>
                                    {t.severity}
                                  </span>
                                  {t.category && (
                                    <span style={{
                                      padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600,
                                      background: "rgba(99,102,241,0.12)", color: "#818cf8",
                                      border: "1px solid rgba(99,102,241,0.2)",
                                    }}>
                                      {t.category}
                                    </span>
                                  )}
                                </div>
                                {t.fix && (
                                  <div style={{
                                    marginLeft: 34, fontSize: 12, color: "#94a3b8",
                                    lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 6,
                                  }}>
                                    <FaLightbulb style={{ color: "#22c55e", marginTop: 2, flexShrink: 0 }} size={11} />
                                    <span>{t.fix}</span>
                                  </div>
                                )}
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Fallback for unparseable text */}
                    {parsed.threats.length === 0 && parsed.severity.length === 0 && (
                      <p className="gs-pre-line" style={{ marginTop: 8 }}>{securityReport.executive_summary}</p>
                    )}
                  </div>
                ) : (
                  <div className="gs-card">
                    <div className="gs-card-title"><FaFileAlt /> AI Security Report</div>
                    <p className="gs-pre-line">{securityReport.executive_summary}</p>
                  </div>
                )
              })()}
            </motion.div>
          )}

          {/* THREATS */}
          {activeTab === "threats" && (
            <motion.div key="threats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="gs-card">
                <div className="gs-card-title"><FaBug /> Identified Threats ({threats.length})</div>
                <div className="gs-table-wrap">
                  <table className="gs-table">
                    <thead>
                      <tr><th>Threat</th><th>Severity</th><th>Category</th><th>Tech</th><th>Score</th></tr>
                    </thead>
                    <tbody>
                      {threats.map((t, i) => {
                        const tRisk = RISK_STYLES[t.risk_level] || RISK_STYLES.Medium
                        const isOpen = expandedThreat === i
                        const threatName = t.threat || t.name || "Unknown"
                        const description = t.description || t.impact || "—"
                        const mitigation = t.mitigation || t.recommendation || ""
                        return (
                          <Fragment key={i}>
                            <tr className={`gs-risk-row ${isOpen ? "gs-risk-row-expanded" : ""}`}
                              onClick={() => setExpandedThreat(isOpen ? null : i)} style={{ cursor: "pointer" }}>
                              <td className="gs-text-bold">
                                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ color: "#6366f1", fontSize: 10 }}>{isOpen ? <FaChevronDown /> : <FaChevronRight />}</span>
                                  {threatName}
                                </span>
                              </td>
                              <td><span className={`gs-badge ${tRisk.badge}`}>{t.risk_level || t.severity}</span></td>
                              <td>{t.category || "—"}</td>
                              <td className="gs-mono">{t.technology || "—"}</td>
                              <td>{t.risk_score ?? "—"}</td>
                            </tr>
                            {isOpen && (
                              <tr className="gs-context-row">
                                <td colSpan={5}>
                                  <div className="gs-code-context" style={{ margin: "8px 12px 12px" }}>
                                    <div className="gs-code-context-header"><FaBug size={12} /> {threatName} — Details</div>
                                    <div style={{ padding: 16 }}>
                                      <div className="gs-ai-section">
                                        <h4>Description</h4>
                                        <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>{description}</p>
                                      </div>
                                      {mitigation && (
                                        <div className="gs-ai-section" style={{ marginTop: 12 }}>
                                          <h4>Recommendation</h4>
                                          <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>{mitigation}</p>
                                        </div>
                                      )}
                                      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
                                        {t.likelihood != null && <span>Likelihood: <strong style={{ color: "#e2e8f0" }}>{t.likelihood}/5</strong></span>}
                                        {t.impact_score != null && <span>Impact: <strong style={{ color: "#e2e8f0" }}>{t.impact_score}/5</strong></span>}
                                        {t.risk_score != null && <span>Score: <strong style={{ color: "#e2e8f0" }}>{t.risk_score}/25</strong></span>}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* FIX PLAN */}
          {activeTab === "fix" && (
            <motion.div key="fix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {recommendations.length > 0 && (
                <div className="gs-card">
                  <div className="gs-card-title"><FaLightbulb /> Recommendations</div>
                  <ol className="gs-ordered-list">
                    {recommendations.map((rec, i) => (
                      <li key={i}>
                        <span className="gs-rec-priority">Priority</span>
                        <strong style={{ color: "var(--textPrimary)" }}>{rec.title}</strong><br />
                        <span style={{ color: "var(--textSecondary)", fontSize: 13 }}>{rec.description}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {fixPlan.immediate && (
                <div className="gs-card">
                  <div className="gs-card-title"><FaRocket /> Fix Plan</div>
                  <div className="gs-ai-section">
                    <h4 style={{ color: "#ef4444" }}>Immediate (0-24 hours)</h4>
                    <ul className="gs-list">{fixPlan.immediate.map((item, i) => <li key={i}>{typeof item === "string" ? item : item.action || item.threat || JSON.stringify(item)}</li>)}</ul>
                  </div>
                  {fixPlan.short_term && (
                    <div className="gs-ai-section" style={{ marginTop: 12 }}>
                      <h4 style={{ color: "#f97316" }}>Short Term (1-7 days)</h4>
                      <ul className="gs-list">{fixPlan.short_term.map((item, i) => <li key={i}>{typeof item === "string" ? item : item.action || item.threat || JSON.stringify(item)}</li>)}</ul>
                    </div>
                  )}
                  {fixPlan.long_term && (
                    <div className="gs-ai-section" style={{ marginTop: 12 }}>
                      <h4 style={{ color: "#22c55e" }}>Long Term (1-4 weeks)</h4>
                      <ul className="gs-list">{fixPlan.long_term.map((item, i) => <li key={i}>{typeof item === "string" ? item : item.action || item.threat || JSON.stringify(item)}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* REPORT */}
          {activeTab === "report" && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="gs-card">
                <div className="gs-card-title"><FaFileAlt /> Threat Report</div>
                {securityReport.severity_breakdown && (
                  <div className="gs-ai-section">
                    <h4>Severity Breakdown</h4>
                    <div className="gs-ai-severity-grid" style={{ marginTop: 8 }}>
                      {Object.entries(securityReport.severity_breakdown).map(([level, desc]) => {
                        const s = RISK_STYLES[level] || RISK_STYLES.Medium
                        return (
                          <div key={level} className="gs-ai-severity-item" style={{ borderLeftColor: s.color }}>
                            <div className="gs-ai-severity-top"><span className="gs-ai-severity-label" style={{ color: s.color }}>{level}</span></div>
                            <p className="gs-ai-severity-desc">{typeof desc === "string" ? desc : JSON.stringify(desc)}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {securityReport.compliance_gaps && (
                  <div className="gs-ai-section" style={{ marginTop: 16 }}>
                    <h4>Compliance Gaps</h4>
                    <ul className="gs-list">{securityReport.compliance_gaps.map((gap, i) => <li key={i}>{typeof gap === "string" ? gap : gap.title || gap.description || JSON.stringify(gap)}</li>)}</ul>
                  </div>
                )}
                <div style={{ marginTop: 20 }}>
                  <button className="gs-btn-primary" onClick={resetToIdle}><FaRocket /> New Analysis</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
