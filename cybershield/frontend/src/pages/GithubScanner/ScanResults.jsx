import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FaGithub,
  FaSearch,
  FaShieldAlt,
  FaBug,
  FaRobot,
  FaFileAlt,
  FaDownload,
  FaExclamationTriangle,
  FaCheckCircle,
  FaStar,
  FaCodeBranch,
  FaUsers,
  FaHashtag,
  FaCode,
  FaChevronDown,
  FaChevronRight,
  FaBox,
  FaCalendarAlt,
  FaClock,
  FaExternalLinkAlt,
  FaClipboardCheck,
  FaArrowRight,
  FaKey,
} from "react-icons/fa"
import API from "../../api/api"
import RepositoryHealth from "../../components/GitHubScanner/RepositoryHealth/RepositoryHealth"
import RepositoryAnalytics from "../../components/GitHubScanner/RepositoryAnalytics/RepositoryAnalytics"

const TABS = [
  { id: "overview", label: "Overview", icon: FaSearch },
  { id: "findings", label: "Findings", icon: FaBug },
  { id: "ai", label: "AI Fix", icon: FaRobot },
  { id: "reports", label: "Reports", icon: FaFileAlt },
]

const getRiskColor = (level) => {
  switch (level?.toLowerCase()) {
    case "critical": return "#ef4444"
    case "high": return "#f97316"
    case "medium": return "#eab308"
    case "low": return "#22c55e"
    default: return "#94a3b8"
  }
}

const getGradeColor = (grade) => {
  switch (grade) {
    case "A": return "#22c55e"
    case "B": return "#84cc16"
    case "C": return "#eab308"
    case "D": return "#f97316"
    case "F": return "#ef4444"
    default: return "#94a3b8"
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return dateStr
  }
}

/* ── Expandable Finding Row ─────────────────────────────── */
function ExpandableRiskRow({ risk, index }) {
  const [expanded, setExpanded] = useState(false)
  const hasContext = risk.locations?.[0]?.context?.length > 0

  return (
    <>
      <tr
        className={`gs-risk-row ${expanded ? "gs-risk-row-expanded" : ""}`}
        onClick={() => hasContext && setExpanded(!expanded)}
        style={{ cursor: hasContext ? "pointer" : "default" }}
      >
        <td className="gs-text-bold">
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {hasContext && (
              <span className="gs-expand-icon" style={{ color: "#6366f1", fontSize: 10 }}>
                {expanded ? <FaChevronDown /> : <FaChevronRight />}
              </span>
            )}
            {risk.title}
          </span>
        </td>
        <td>
          <span className={`gs-badge gs-badge-${risk.severity?.toLowerCase()}`}>
            {risk.severity}
          </span>
        </td>
        <td className="gs-mono">{risk.file}</td>
        <td>
          {risk.line && (
            <span className="gs-line-badge">L{risk.line}{risk.column ? `:C${risk.column}` : ""}</span>
          )}
        </td>
        <td>
          {risk.language && (
            <span className="gs-lang-badge">{risk.language}</span>
          )}
        </td>
        <td>{risk.recommendation}</td>
      </tr>
      {expanded && hasContext && (
        <tr className="gs-context-row">
          <td colSpan={6}>
            <div className="gs-code-context">
              <div className="gs-code-context-header">
                <FaCode size={12} /> Code Context — {risk.file}
              </div>
              <div className="gs-code-block">
                {risk.locations[0].context.map((ctx, ci) => (
                  <div
                    key={ci}
                    className={`gs-code-line ${ctx.is_vulnerable ? "gs-code-vulnerable" : "gs-code-safe"}`}
                  >
                    <span className="gs-code-linenum">{ctx.line}</span>
                    <span className="gs-code-indicator">
                      {ctx.is_vulnerable ? "⚠" : ""}
                    </span>
                    <code>{ctx.code || "\u00A0"}</code>
                  </div>
                ))}
              </div>
              {risk.snippet && (
                <div className="gs-snippet-note">
                  <strong>Vulnerable snippet:</strong> <code>{risk.snippet}</code>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function ScanResults({ result, repoUrl, onRescan }) {
  const [activeTab, setActiveTab] = useState("findings")
  const [activeSecretFilter, setActiveSecretFilter] = useState("all")
  const [expandedFile, setExpandedFile] = useState(null)

  const downloadReport = async () => {
    try {
      const response = await API.post(
        "/github/generate-pdf",
        { report: result?.report },
        { responseType: "blob" }
      )
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "CyberShield_Report.pdf")
      document.body.appendChild(link)
      link.click()
    } catch (error) {
      console.error("PDF download failed:", error)
    }
  }

  const repoInfo = result?.repository_info || {}
  const riskDashboard = result?.risk_dashboard || {}
  const stats = repoInfo.statistics || {}
  const depReport = result?.dependency_report || {}
  const depFindings = result?.dependency_findings || []
  const aiReport = result?.ai_report || {}
  const scanSummary = result?.scan_summary || {}
  const fileBreakdown = result?.file_breakdown || []
  const totalFileIssues = fileBreakdown.reduce((acc, f) => acc + f.issueCount, 0)

  return (
    <div className="gs-page">
      {/* Repository Header */}
      <motion.div
        className="gs-repo-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="gs-repo-header-left">
          <div className="gs-repo-icon">
            <FaGithub />
          </div>
          <div>
            <h1 className="gs-repo-name">{result?.repository || repoUrl}</h1>
            {repoInfo.description && (
              <p className="gs-repo-desc">{repoInfo.description}</p>
            )}
          </div>
        </div>

        <div className="gs-repo-header-stats">
          <div className="gs-stat-chip">
            <FaStar style={{ color: "#eab308" }} />
            <span>{repoInfo.stars?.toLocaleString() ?? "—"}</span>
          </div>
          <div className="gs-stat-chip">
            <FaCodeBranch style={{ color: "#6366f1" }} />
            <span>{repoInfo.forks?.toLocaleString() ?? "—"}</span>
          </div>
          <div className="gs-stat-chip">
            <FaUsers style={{ color: "#a855f7" }} />
            <span>{stats.contributors ?? "—"}</span>
          </div>
          {result?.risk_level && (
            <div
              className="gs-grade-badge"
              style={{
                background: getRiskColor(result.risk_level) + "22",
                color: getRiskColor(result.risk_level),
              }}
            >
              {result.risk_level}
            </div>
          )}
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="gs-tabs-bar">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`gs-tab-btn ${activeTab === tab.id ? "gs-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* ── Overview Tab ─────────────────────────────── */}
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            className="gs-tab-content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <RepositoryHealth
              repository={repoInfo}
              technologies={result?.technologies}
              dependency={depReport}
              topics={repoInfo.topics || []}
            />
            <RepositoryAnalytics
              repository={repoInfo}
              technologies={result?.technologies}
              dependencyReport={depReport}
              scanSummary={scanSummary}
              findings={result?.findings || []}
              dependencyFindings={depFindings}
            />
          </motion.div>
        )}

        {/* ── Findings Tab ────────────────────────────── */}
        {activeTab === "findings" && (
          <motion.div
            key="findings"
            className="gs-tab-content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* Severity Cards */}
            {result?.severity_summary && (
              <div className="gs-severity-grid">
                {[
                  { label: "Critical", count: result.severity_summary.critical, color: "#ef4444", bg: "#ef444418" },
                  { label: "High", count: result.severity_summary.high, color: "#f97316", bg: "#f9731618" },
                  { label: "Medium", count: result.severity_summary.medium, color: "#eab308", bg: "#eab30818" },
                  { label: "Low", count: result.severity_summary.low, color: "#22c55e", bg: "#22c55e18" },
                ].map((s) => (
                  <div key={s.label} className="gs-severity-card" style={{ borderColor: s.color + "40", background: s.bg }}>
                    <span className="gs-severity-label" style={{ color: s.color }}>{s.label}</span>
                    <span className="gs-severity-count" style={{ color: s.color }}>{s.count}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Top Risks — Enhanced with code context */}
            {result?.top_risks?.length > 0 && (
              <div className="gs-card">
                <h3 className="gs-card-title"><FaExclamationTriangle /> Top Risks</h3>
                <p className="gs-card-subtitle">Click on a row with code context to expand and view vulnerable code</p>
                <div className="gs-table-wrap">
                  <table className="gs-table">
                    <thead>
                      <tr>
                        <th>Risk</th>
                        <th>Severity</th>
                        <th>File</th>
                        <th>Line</th>
                        <th>Language</th>
                        <th>Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.top_risks.map((risk, i) => (
                        <ExpandableRiskRow key={i} risk={risk} index={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Secrets Detected */}
            {result?.secret_summary && (
              <div className="gs-card">
                <h3 className="gs-card-title"><FaExclamationTriangle /> Secrets Detected</h3>
                <div className="gs-filter-bar">
                  {["all", "critical", "high", "medium"].map((f) => (
                    <button
                      key={f}
                      className={`gs-filter-btn ${activeSecretFilter === f ? "gs-filter-active" : ""}`}
                      onClick={() => setActiveSecretFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                {result.advanced_secrets?.length > 0 ? (
                  <div className="gs-table-wrap">
                    <table className="gs-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>File</th>
                          <th>Line</th>
                          <th>Severity</th>
                          <th>Recommendation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.advanced_secrets
                          .filter((s) => activeSecretFilter === "all" || s.severity?.toLowerCase() === activeSecretFilter)
                          .map((s, i) => (
                            <tr key={i}>
                              <td className="gs-text-bold">{s.type}</td>
                              <td className="gs-mono">{s.file}</td>
                              <td>
                                {s.line && <span className="gs-line-badge">L{s.line}</span>}
                              </td>
                              <td>
                                <span className={`gs-badge gs-badge-${s.severity?.toLowerCase()}`}>
                                  {s.severity}
                                </span>
                              </td>
                              <td>{s.recommendation}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="gs-empty-text">No secrets detected in scanned files.</p>
                )}
              </div>
            )}

            {/* Category Summary — Enhanced */}
            {result?.category_summary && (
              <div className="gs-card">
                <h3 className="gs-card-title"><FaBug /> Issue Categories</h3>
                <div className="gs-cat-grid-enhanced">
                  {(() => {
                    const maxCount = Math.max(...Object.values(result.category_summary), 1)
                    const catColors = {
                      "Subprocess Execution": { color: "#f97316", bg: "#f9731618", icon: FaArrowRight },
                      "Python exec()": { color: "#ef4444", bg: "#ef444418", icon: FaExclamationTriangle },
                      "Javascript eval()": { color: "#ef4444", bg: "#ef444418", icon: FaExclamationTriangle },
                      "Command Execution": { color: "#f97316", bg: "#f9731618", icon: FaArrowRight },
                      "Hardcoded Token": { color: "#eab308", bg: "#eab30818", icon: FaClipboardCheck },
                      "Password Variable": { color: "#a855f7", bg: "#a855f718", icon: FaShieldAlt },
                      "AWS Access Key": { color: "#f59e0b", bg: "#f59e0b18", icon: FaKey },
                      "Secret Detection": { color: "#ef4444", bg: "#ef444418", icon: FaShieldAlt },
                      "SQL Injection": { color: "#ef4444", bg: "#ef444418", icon: FaExclamationTriangle },
                      "XSS": { color: "#f97316", bg: "#f9731618", icon: FaExclamationTriangle },
                    }
                    const defaultColor = { color: "#6366f1", bg: "#6366f118", icon: FaBug }
                    return Object.entries(result.category_summary)
                      .sort(([,a], [,b]) => b - a)
                      .map(([key, count]) => {
                        const cfg = catColors[key] || catColors[key.toLowerCase()] || defaultColor
                        const CatIcon = cfg.icon
                        const pct = Math.round((count / maxCount) * 100)
                        return (
                          <div key={key} className="gs-cat-card-enhanced" style={{ "--cat-color": cfg.color, "--cat-bg": cfg.bg }}>
                            <div className="gs-cat-card-top">
                              <div className="gs-cat-icon-wrap" style={{ background: cfg.bg, color: cfg.color }}>
                                <CatIcon size={16} />
                              </div>
                              <div className="gs-cat-info">
                                <span className="gs-cat-name">{key}</span>
                                <span className="gs-cat-num" style={{ color: cfg.color }}>{count}</span>
                              </div>
                            </div>
                            <div className="gs-cat-bar-track">
                              <div className="gs-cat-bar-fill" style={{ width: `${pct}%`, background: cfg.color }} />
                            </div>
                          </div>
                        )
                      })
                  })()}
                </div>
              </div>
            )}

            {/* File-wise Breakdown */}
            {fileBreakdown.length > 0 && (
              <div className="gs-card">
                <h3 className="gs-card-title"><FaCode /> File-wise Breakdown</h3>
                <div className="gs-table-wrap">
                  <table className="gs-table">
                    <thead>
                      <tr>
                        <th>File</th>
                        <th>Language</th>
                        <th>Total Issues</th>
                        <th>Critical</th>
                        <th>Medium</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fileBreakdown.map((fb, i) => (
                        <tr key={i}>
                          <td className="gs-mono gs-text-bold">{fb.file}</td>
                          <td>
                            {fb.language && <span className="gs-lang-badge">{fb.language}</span>}
                          </td>
                          <td className="gs-text-bold">{fb.issueCount}</td>
                          <td>
                            {fb.criticalCount > 0 && (
                              <span className="gs-badge gs-badge-critical">{fb.criticalCount}</span>
                            )}
                          </td>
                          <td>
                            {fb.mediumCount > 0 && (
                              <span className="gs-badge gs-badge-medium">{fb.mediumCount}</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="gs-expand-btn"
                              onClick={() => setExpandedFile(expandedFile === i ? null : i)}
                            >
                              {expandedFile === i ? "Collapse" : "View Issues"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Expanded file issues */}
                {expandedFile !== null && fileBreakdown[expandedFile] && (
                  <div className="gs-expanded-issues">
                    <h4 className="gs-expanded-title">
                      Issues in {fileBreakdown[expandedFile].file}
                    </h4>
                    {fileBreakdown[expandedFile].issues.map((issue, ii) => (
                      <div key={ii} className="gs-issue-item">
                        <div className="gs-issue-header">
                          <span className={`gs-badge gs-badge-${issue.severity?.toLowerCase()}`}>
                            {issue.severity}
                          </span>
                          <span className="gs-issue-type">{issue.type}</span>
                          <span className="gs-line-badge">Line {issue.line}</span>
                          <span className="gs-lang-badge">{issue.language}</span>
                        </div>
                        {issue.locations?.[0]?.snippet && (
                          <div className="gs-issue-snippet">
                            <code>{issue.locations[0].snippet}</code>
                          </div>
                        )}
                        {issue.locations?.[0]?.context && (
                          <div className="gs-mini-code-context">
                            {issue.locations[0].context.map((ctx, ci) => (
                              <div
                                key={ci}
                                className={`gs-code-line ${ctx.is_vulnerable ? "gs-code-vulnerable" : "gs-code-safe"}`}
                              >
                                <span className="gs-code-linenum">{ctx.line}</span>
                                <span className="gs-code-indicator">
                                  {ctx.is_vulnerable ? "⚠" : ""}
                                </span>
                                <code>{ctx.code || "\u00A0"}</code>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dependency Findings */}
            {depFindings.length > 0 && (
              <div className="gs-card">
                <h3 className="gs-card-title"><FaBox /> Dependency Findings ({depFindings.length})</h3>
                <div className="gs-table-wrap">
                  <table className="gs-table">
                    <thead>
                      <tr>
                        <th>Package</th>
                        <th>Version</th>
                        <th>Status</th>
                        <th>Severity</th>
                        <th>Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {depFindings.map((pkg, idx) => (
                        <tr key={idx}>
                          <td className="gs-text-bold">{pkg.package}</td>
                          <td className="gs-mono">{pkg.version}</td>
                          <td>{pkg.status}</td>
                          <td>
                            <span className={`gs-badge gs-badge-${pkg.severity?.toLowerCase() || "low"}`}>
                              {pkg.severity}
                            </span>
                          </td>
                          <td>{pkg.recommendation || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── AI Fix Tab ──────────────────────────────── */}
        {activeTab === "ai" && (
          <motion.div
            key="ai"
            className="gs-tab-content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* AI Security Report */}
            <div className="gs-card">
              <h3 className="gs-card-title"><FaRobot /> AI Security Analysis</h3>
              {aiReport.summary && (
                <div className="gs-ai-section">
                  <h4>Repository Summary</h4>
                  <p>{aiReport.summary}</p>
                </div>
              )}
              {aiReport.business_impact?.length > 0 && (
                <div className="gs-ai-section">
                  <h4>Business Impact</h4>
                  <ul className="gs-list">
                    {aiReport.business_impact
                      .filter(impact => impact && impact !== "Unknown")
                      .map((impact, i) => (
                        <li key={i} className="gs-impact-item">
                          <FaExclamationTriangle size={12} style={{ color: "#f97316", flexShrink: 0 }} />
                          {impact}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {aiReport.dependency_analysis && (
                <div className="gs-ai-section">
                  <h4>Dependency Analysis</h4>
                  <div className="gs-dep-analysis-box">
                    <FaBox size={14} style={{ color: "#06b6d4", flexShrink: 0 }} />
                    <p>{aiReport.dependency_analysis}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Executive Summary */}
            {result?.executive_summary && (
              <div className="gs-card gs-card-accent">
                <h3 className="gs-card-title"><FaFileAlt /> Executive Summary</h3>
                <p className="gs-pre-line">{result.executive_summary}</p>
              </div>
            )}

            {/* Recommendations */}
            {result?.recommendations?.length > 0 && (
              <div className="gs-card">
                <h3 className="gs-card-title"><FaCheckCircle /> Recommendations</h3>
                <ol className="gs-ordered-list">
                  {result.recommendations.map((rec, i) => (
                    <li key={i}>
                      {typeof rec === "string" ? rec : (
                        <>
                          {rec.priority && <span className="gs-rec-priority">{rec.priority}</span>}
                          {rec.recommendation || rec}
                        </>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Score Card */}
            {result?.score_card && (
              <div className="gs-card">
                <h3 className="gs-card-title"><FaShieldAlt /> Security Score Card</h3>
                <div className="gs-score-grid">
                  {Object.entries(result.score_card).map(([key, score]) => {
                    const val = parseInt(score.split("/")[0])
                    const color = val >= 80 ? "#22c55e" : val >= 60 ? "#eab308" : val >= 40 ? "#f97316" : "#ef4444"
                    return (
                      <div key={key} className="gs-score-item">
                        <span className="gs-score-label">{key}</span>
                        <span className="gs-score-value" style={{ color }}>{score}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* AI Severity Breakdown */}
            {result?.severity_summary && (
              <div className="gs-card">
                <h3 className="gs-card-title"><FaClipboardCheck /> Severity Breakdown</h3>
                <div className="gs-ai-severity-grid">
                  {[
                    { label: "Critical", count: result.severity_summary.critical, color: "#ef4444", desc: "Requires immediate attention" },
                    { label: "High", count: result.severity_summary.high, color: "#f97316", desc: "Should be addressed soon" },
                    { label: "Medium", count: result.severity_summary.medium, color: "#eab308", desc: "Review and remediate" },
                    { label: "Low", count: result.severity_summary.low, color: "#22c55e", desc: "Minor issues" },
                  ].map((s) => (
                    <div key={s.label} className="gs-ai-severity-item" style={{ borderLeftColor: s.color }}>
                      <div className="gs-ai-severity-top">
                        <span className="gs-ai-severity-label" style={{ color: s.color }}>{s.label}</span>
                        <span className="gs-ai-severity-count" style={{ color: s.color }}>{s.count}</span>
                      </div>
                      <span className="gs-ai-severity-desc">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Reports Tab ─────────────────────────────── */}
        {activeTab === "reports" && (
          <motion.div
            key="reports"
            className="gs-tab-content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* Executive Report */}
            <div className="gs-card">
              <h3 className="gs-card-title"><FaFileAlt /> Executive Report</h3>
              <div className="gs-report-meta">
                <div>
                  <span className="gs-report-label">Repository</span>
                  <span className="gs-report-value">{result?.repository}</span>
                </div>
                <div>
                  <span className="gs-report-label">Risk Level</span>
                  <span className="gs-report-value" style={{ color: getRiskColor(result?.ai_report?.risk_level || result?.risk_level) }}>
                    {result?.ai_report?.risk_level || result?.risk_level || "—"}
                  </span>
                </div>
                <div>
                  <span className="gs-report-label">Risk Score</span>
                  <span className="gs-report-value">{result?.risk_score ?? "—"}/100</span>
                </div>
                <div>
                  <span className="gs-report-label">Security Score</span>
                  <span className="gs-report-value" style={{ color: result?.security_score >= 60 ? "#22c55e" : "#ef4444" }}>
                    {result?.security_score ?? "—"}/100
                  </span>
                </div>
                <div>
                  <span className="gs-report-label">Total Files Scanned</span>
                  <span className="gs-report-value">{scanSummary.total_files_with_issues ?? "—"}</span>
                </div>
                <div>
                  <span className="gs-report-label">Total Findings</span>
                  <span className="gs-report-value">{(result?.findings || []).length}</span>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            {result?.executive_summary && (
              <div className="gs-card gs-card-accent">
                <h3 className="gs-card-title"><FaFileAlt /> Executive Summary</h3>
                <p className="gs-pre-line">{result.executive_summary}</p>
              </div>
            )}

            {/* AI Report Summary */}
            {aiReport.summary && (
              <div className="gs-card">
                <h3 className="gs-card-title"><FaRobot /> AI Report Summary</h3>
                <p>{aiReport.summary}</p>
                {aiReport.dependency_analysis && (
                  <div className="gs-dep-analysis-box" style={{ marginTop: 12 }}>
                    <FaBox size={14} style={{ color: "#06b6d4", flexShrink: 0 }} />
                    <p>{aiReport.dependency_analysis}</p>
                  </div>
                )}
              </div>
            )}

            {/* Severity Breakdown for Report */}
            {result?.severity_summary && (
              <div className="gs-card">
                <h3 className="gs-card-title"><FaShieldAlt /> Severity Breakdown</h3>
                <div className="gs-report-severity-grid">
                  {[
                    { label: "Critical", count: result.severity_summary.critical, color: "#ef4444" },
                    { label: "High", count: result.severity_summary.high, color: "#f97316" },
                    { label: "Medium", count: result.severity_summary.medium, color: "#eab308" },
                    { label: "Low", count: result.severity_summary.low, color: "#22c55e" },
                  ].map((s) => (
                    <div key={s.label} className="gs-report-sev-item" style={{ borderColor: s.color + "40", background: s.color + "10" }}>
                      <span style={{ color: s.color, fontWeight: 700, fontSize: 20 }}>{s.count}</span>
                      <span style={{ color: s.color, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File-wise Report */}
            {fileBreakdown.length > 0 && (
              <div className="gs-card">
                <h3 className="gs-card-title"><FaCode /> File-wise Security Report</h3>
                <div className="gs-table-wrap">
                  <table className="gs-table">
                    <thead>
                      <tr>
                        <th>File</th>
                        <th>Language</th>
                        <th>Issues</th>
                        <th>Critical</th>
                        <th>High</th>
                        <th>Medium</th>
                        <th>Low</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fileBreakdown.map((fb, i) => (
                        <tr key={i}>
                          <td className="gs-mono gs-text-bold">{fb.file}</td>
                          <td><span className="gs-lang-badge">{fb.language}</span></td>
                          <td className="gs-text-bold">{fb.issueCount}</td>
                          <td>{fb.criticalCount > 0 ? <span className="gs-badge gs-badge-critical">{fb.criticalCount}</span> : "0"}</td>
                          <td>{fb.highCount > 0 ? <span className="gs-badge gs-badge-high">{fb.highCount}</span> : "0"}</td>
                          <td>{fb.mediumCount > 0 ? <span className="gs-badge gs-badge-medium">{fb.mediumCount}</span> : "0"}</td>
                          <td>{fb.lowCount > 0 ? <span className="gs-badge gs-badge-low">{fb.lowCount}</span> : "0"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Dependency Health Report */}
            {(depReport.totalPackages > 0 || depFindings.length > 0) && (
              <div className="gs-card">
                <h3 className="gs-card-title"><FaBox /> Dependency Health Report</h3>
                <div className="gs-report-dep-grid">
                  <div className="gs-report-dep-stat">
                    <span className="gs-report-dep-value" style={{ color: "#06b6d4" }}>{depReport.totalPackages || 0}</span>
                    <span className="gs-report-dep-label">Total Packages</span>
                  </div>
                  <div className="gs-report-dep-stat">
                    <span className="gs-report-dep-value" style={{ color: "#f59e0b" }}>{depReport.outdated || 0}</span>
                    <span className="gs-report-dep-label">Outdated</span>
                  </div>
                  <div className="gs-report-dep-stat">
                    <span className="gs-report-dep-value" style={{ color: "#ef4444" }}>{depReport.risky || 0}</span>
                    <span className="gs-report-dep-label">Risky</span>
                  </div>
                  <div className="gs-report-dep-stat">
                    <span className="gs-report-dep-value" style={{ color: "#a855f7" }}>{depReport.unpinned || 0}</span>
                    <span className="gs-report-dep-label">Unpinned</span>
                  </div>
                </div>
                {depFindings.length > 0 && (
                  <div className="gs-table-wrap" style={{ marginTop: 16 }}>
                    <table className="gs-table">
                      <thead>
                        <tr>
                          <th>Package</th>
                          <th>Version</th>
                          <th>Status</th>
                          <th>Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {depFindings.map((pkg, idx) => (
                          <tr key={idx}>
                            <td className="gs-text-bold">{pkg.package}</td>
                            <td className="gs-mono">{pkg.version}</td>
                            <td>{pkg.status}</td>
                            <td>
                              <span className={`gs-badge gs-badge-${pkg.severity?.toLowerCase() || "low"}`}>
                                {pkg.severity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations for Report */}
            {result?.recommendations?.length > 0 && (
              <div className="gs-card">
                <h3 className="gs-card-title"><FaCheckCircle /> Key Recommendations</h3>
                <ol className="gs-ordered-list">
                  {result.recommendations.map((rec, i) => (
                    <li key={i}>{typeof rec === "string" ? rec : rec.recommendation || rec}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Scan Metadata */}
            <div className="gs-card">
              <h3 className="gs-card-title"><FaClock /> Scan Information</h3>
              <div className="gs-report-meta">
                <div>
                  <span className="gs-report-label">Scan Summary</span>
                  <span className="gs-report-value" style={{ fontSize: 13 }}>{scanSummary.summary || "—"}</span>
                </div>
                <div>
                  <span className="gs-report-label">Risk Level</span>
                  <span className="gs-report-value" style={{ color: getRiskColor(scanSummary.risk_level) }}>
                    {scanSummary.risk_level || "—"}
                  </span>
                </div>
                <div>
                  <span className="gs-report-label">Files with Issues</span>
                  <span className="gs-report-value">{scanSummary.total_files_with_issues ?? "—"}</span>
                </div>
              </div>
            </div>

            {/* Export */}
            <div className="gs-card">
              <h3 className="gs-card-title"><FaDownload /> Export</h3>
              <button className="gs-btn-primary gs-btn-lg" onClick={downloadReport}>
                <FaDownload /> Download PDF Report
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rescan Button */}
      <div className="gs-url-bar" style={{ justifyContent: "center", marginTop: 24 }}>
        <button className="gs-btn-outline" onClick={onRescan}>
          <FaSearch /> Scan Another Repository
        </button>
      </div>
    </div>
  )
}
