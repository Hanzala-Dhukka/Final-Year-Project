import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  FaShieldAlt,
  FaBug,
  FaExclamationTriangle,
  FaCheckCircle,
  FaStar,
  FaCodeBranch,
  FaUsers,
  FaFolder,
  FaFile,
  FaDownload,
  FaRobot,
  FaArrowRight,
  FaSpinner,
  FaGithub,
  FaHashtag,
  FaSync,
} from "react-icons/fa"
import API from "../../api/api"
import "./ScannerResults.css"

export default function ScannerResults() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)
        const res = await API.get(`/scanner/${id}/results`)
        setResult(res.data)
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load scan results.")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchResults()
  }, [id])

  const downloadReport = async () => {
    try {
      const response = await API.post(
        "/github/generate-pdf",
        { report: result },
        { responseType: "blob" }
      )
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `CyberShield_Report_${id || "scan"}.pdf`)
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="sr-page">
        <div className="sr-loading">
          <FaSpinner className="sr-spin" />
          <p>Loading scan results...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="sr-page">
        <div className="sr-error">
          <FaExclamationTriangle />
          <p>{error || "No results found."}</p>
          <button className="sr-btn-outline" onClick={() => navigate("/scanner/setup")}>
            Back to Setup
          </button>
        </div>
      </div>
    )
  }

  const repoInfo = result.repository_info || {}
  const riskDashboard = result.risk_dashboard || {}
  const stats = repoInfo.statistics || {}
  const severitySummary = result.severity_summary || {}
  const findings = result.findings || result.top_risks || []
  const languages = repoInfo.languages || {}

  const totalFindings = (severitySummary.critical || 0) + (severitySummary.high || 0) + (severitySummary.medium || 0) + (severitySummary.low || 0)

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

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case "critical": return "#ef4444"
      case "high": return "#f97316"
      case "medium": return "#eab308"
      case "low": return "#22c55e"
      default: return "#94a3b8"
    }
  }

  return (
    <div className="sr-page">
      {/* ── Completion Banner ──────────────────────────────── */}
      <motion.div
        className="sr-banner"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="sr-banner-left">
          <FaCheckCircle className="sr-banner-icon" />
          <div>
            <h1 className="sr-banner-title">Security Scan Completed</h1>
            <p className="sr-banner-sub">{repoInfo.repository || "Repository"}</p>
          </div>
        </div>
        <div className="sr-banner-actions">
          <button className="sr-btn-outline" onClick={() => navigate("/scanner/setup")}>
            <FaSync /> New Scan
          </button>
          <button className="sr-btn-primary" onClick={downloadReport}>
            <FaDownload /> Download Report
          </button>
        </div>
      </motion.div>

      {/* ── Score + Risk Row ───────────────────────────────── */}
      <motion.div
        className="sr-score-row"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Security Score */}
        <div className="sr-card sr-score-card">
          <div className="sr-score-ring" style={{ borderColor: getGradeColor(riskDashboard.security_grade) }}>
            <span className="sr-score-value" style={{ color: getGradeColor(riskDashboard.security_grade) }}>
              {riskDashboard.risk_score?.toFixed(0) || "—"}
            </span>
            <span className="sr-score-label">/ 100</span>
          </div>
          <div className="sr-score-meta">
            <span className="sr-grade" style={{ color: getGradeColor(riskDashboard.security_grade) }}>
              Grade {riskDashboard.security_grade || "—"}
            </span>
            <span className="sr-risk" style={{ color: getRiskColor(riskDashboard.risk_level) }}>
              Risk: {riskDashboard.risk_level || "—"}
            </span>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="sr-card sr-severity-card">
          <h3 className="sr-card-title"><FaBug /> Findings Summary</h3>
          <div className="sr-severity-grid">
            {[
              { label: "Critical", count: severitySummary.critical || 0, color: "#ef4444" },
              { label: "High", count: severitySummary.high || 0, color: "#f97316" },
              { label: "Medium", count: severitySummary.medium || 0, color: "#eab308" },
              { label: "Low", count: severitySummary.low || 0, color: "#22c55e" },
            ].map((s) => (
              <div key={s.label} className="sr-sev-item" style={{ borderLeftColor: s.color }}>
                <span className="sr-sev-count" style={{ color: s.color }}>{s.count}</span>
                <span className="sr-sev-label">{s.label}</span>
              </div>
            ))}
          </div>
          <p className="sr-total">{totalFindings} total findings</p>
        </div>
      </motion.div>

      {/* ── Repository Intelligence ─────────────────────────── */}
      <motion.div
        className="sr-card sr-intel"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <h3 className="sr-card-title"><FaGithub /> Repository Intelligence</h3>
        <div className="sr-intel-grid">
          {[
            { icon: FaFile, label: "Files", value: stats.files ?? "—" },
            { icon: FaFolder, label: "Directories", value: stats.directories ?? "—" },
            { icon: FaStar, label: "Stars", value: stats.stars?.toLocaleString() ?? "—" },
            { icon: FaCodeBranch, label: "Forks", value: stats.forks ?? "—" },
            { icon: FaHashtag, label: "Commits", value: stats.commits ?? "—" },
            { icon: FaUsers, label: "Contributors", value: stats.contributors ?? "—" },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="sr-intel-item">
                <Icon className="sr-intel-icon" />
                <span className="sr-intel-value">{item.value}</span>
                <span className="sr-intel-label">{item.label}</span>
              </div>
            )
          })}
        </div>

        {/* Languages */}
        {Object.keys(languages).length > 0 && (
          <div className="sr-languages">
            <h4 className="sr-sub-title">Languages</h4>
            <div className="sr-lang-bars">
              {Object.entries(languages)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([lang, pct]) => (
                  <div key={lang} className="sr-lang-item">
                    <div className="sr-lang-info">
                      <span className="sr-lang-name">{lang}</span>
                      <span className="sr-lang-pct">{typeof pct === "number" ? `${pct}%` : pct}</span>
                    </div>
                    <div className="sr-lang-track">
                      <div
                        className="sr-lang-fill"
                        style={{ width: `${typeof pct === "number" ? pct : 50}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Security Findings Table ────────────────────────── */}
      {findings.length > 0 && (
        <motion.div
          className="sr-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h3 className="sr-card-title"><FaExclamationTriangle /> Security Findings</h3>
          <div className="sr-table-wrap">
            <table className="sr-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Issue</th>
                  <th>Location</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {findings.slice(0, 12).map((f, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`sr-badge sr-badge-${(f.severity || "").toLowerCase()}`}>
                        {f.severity}
                      </span>
                    </td>
                    <td className="sr-text-bold">{f.title || f.rule || "—"}</td>
                    <td className="sr-mono">{f.file || f.location || "—"}</td>
                    <td>
                      {f.id && (
                        <button
                          className="sr-link-btn"
                          onClick={() => navigate(`/scanner/remediation/${f.id}`)}
                        >
                          View <FaArrowRight />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {findings.length > 12 && (
            <button
              className="sr-btn-text"
              onClick={() => navigate(`/vulnerability-dashboard/${id}`)}
            >
              View All {findings.length} Findings <FaArrowRight />
            </button>
          )}
        </motion.div>
      )}

      {/* ── AI Summary + Actions ───────────────────────────── */}
      {result.ai_report?.summary && (
        <motion.div
          className="sr-card sr-ai-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <h3 className="sr-card-title"><FaRobot /> AI Analysis</h3>
          <p className="sr-ai-text">{result.ai_report.summary}</p>
          <div className="sr-action-row">
            <button
              className="sr-btn-primary"
              onClick={() => navigate(`/vulnerability-dashboard/${id}`)}
            >
              View All Findings <FaArrowRight />
            </button>
            <button className="sr-btn-outline" onClick={downloadReport}>
              <FaDownload /> Download PDF
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
