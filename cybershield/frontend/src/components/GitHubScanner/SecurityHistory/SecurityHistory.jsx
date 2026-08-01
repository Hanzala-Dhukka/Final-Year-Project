import { useMemo } from "react"
import {
  FaHistory,
  FaShieldAlt,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaCalendarAlt,
  FaFileCode,
  FaBug,
} from "react-icons/fa"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import "./SecurityHistory.css"

function riskColor(level) {
  switch (level?.toLowerCase()) {
    case "critical":
      return "#ef4444"
    case "high":
      return "#f97316"
    case "medium":
      return "#eab308"
    case "low":
      return "#22c55e"
    default:
      return "#94a3b8"
  }
}

function gradeColor(grade) {
  if (!grade) return "#94a3b8"
  const g = grade.charAt(0).toUpperCase()
  if (g === "A") return "#22c55e"
  if (g === "B") return "#38bdf8"
  if (g === "C") return "#eab308"
  if (g === "D") return "#f97316"
  return "#ef4444"
}

function formatDate(dateStr) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

function formatTime(dateStr) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

export default function SecurityHistory({ history = [] }) {
  // Compute trend data for chart
  const chartData = useMemo(() => {
    return [...history]
      .reverse()
      .map((scan, i) => ({
        name: `Scan ${i + 1}`,
        date: formatDate(scan.scan_date),
        issues: scan.total_findings || 0,
        score: scan.risk_score || 0,
      }))
  }, [history])

  // Compute improvement between latest and previous
  const improvement = useMemo(() => {
    if (history.length < 2) return null
    const latest = history[0]
    const previous = history[1]
    const latestCount = latest.total_findings || 0
    const prevCount = previous.total_findings || 0
    if (prevCount === 0) return null
    const pct = Math.round(((prevCount - latestCount) / prevCount) * 100)
    return { pct, prevCount, latestCount }
  }, [history])

  if (!history.length) {
    return (
      <div className="sh-card sh-empty">
        <FaHistory className="sh-empty-icon" />
        <h3>No Scan History</h3>
        <p>Run multiple scans on this repository to see security trends over time.</p>
      </div>
    )
  }

  return (
    <div className="sh-container">
      {/* Header */}
      <div className="sh-header">
        <FaHistory className="sh-header-icon" />
        <h2>Repository Security History</h2>
        <span className="sh-count">{history.length} scans</span>
      </div>

      {/* Improvement Banner */}
      {improvement && (
        <div className={`sh-improvement ${improvement.pct >= 0 ? "sh-improve-positive" : "sh-improve-negative"}`}>
          {improvement.pct >= 0 ? (
            <FaArrowUp className="sh-improve-icon" />
          ) : (
            <FaArrowDown className="sh-improve-icon" />
          )}
          <span>
            <strong>{Math.abs(improvement.pct)}%</strong> {improvement.pct >= 0 ? "Security Improvement" : "Regression"} since last scan
          </span>
          <span className="sh-improve-detail">
            {improvement.prevCount} issues → {improvement.latestCount} issues
          </span>
        </div>
      )}

      {/* Trend Chart */}
      {chartData.length >= 2 && (
        <div className="sh-card">
          <h3 className="sh-card-title">
            <FaBug /> Vulnerability Trend
          </h3>
          <div className="sh-chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Bar dataKey="issues" fill="#f97316" radius={[4, 4, 0, 0]} name="Issues" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Score Trend Chart */}
      {chartData.length >= 2 && (
        <div className="sh-card">
          <h3 className="sh-card-title">
            <FaShieldAlt /> Security Score Trend
          </h3>
          <div className="sh-chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Bar dataKey="score" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Scan Cards */}
      <div className="sh-scans-list">
        {history.map((scan, index) => {
          const isLatest = index === 0
          const prev = history[index + 1]
          const delta = prev ? (prev.total_findings || 0) - (scan.total_findings || 0) : null

          return (
            <div className={`sh-scan-card ${isLatest ? "sh-scan-latest" : ""}`} key={scan.scan_id || index}>
              {/* Left: Scan Number + Date */}
              <div className="sh-scan-left">
                <div className="sh-scan-number">
                  #{history.length - index}
                </div>
                <div className="sh-scan-date">
                  <FaCalendarAlt />
                  <span>{formatDate(scan.scan_date)}</span>
                  <span className="sh-scan-time">{formatTime(scan.scan_date)}</span>
                </div>
              </div>

              {/* Center: Metrics */}
              <div className="sh-scan-metrics">
                <div className="sh-metric">
                  <label>Risk</label>
                  <span className="sh-badge" style={{ background: riskColor(scan.risk_level) + "22", color: riskColor(scan.risk_level) }}>
                    {scan.risk_level}
                  </span>
                </div>
                <div className="sh-metric">
                  <label>Issues</label>
                  <strong>{scan.total_findings}</strong>
                </div>
                <div className="sh-metric">
                  <label>Grade</label>
                  <strong style={{ color: gradeColor(scan.security_grade) }}>{scan.security_grade}</strong>
                </div>
                <div className="sh-metric">
                  <label>Score</label>
                  <strong>{scan.risk_score}</strong>
                </div>
                <div className="sh-metric">
                  <label>Files</label>
                  <span className="sh-files-icon">
                    <FaFileCode /> {scan.scanned_files}
                  </span>
                </div>
              </div>

              {/* Right: Delta */}
              <div className="sh-scan-right">
                {delta !== null && delta !== 0 && (
                  <div className={`sh-delta ${delta > 0 ? "sh-delta-good" : "sh-delta-bad"}`}>
                    {delta > 0 ? <FaArrowUp /> : <FaArrowDown />}
                    <span>{Math.abs(delta)}</span>
                  </div>
                )}
                {delta === 0 && (
                  <div className="sh-delta sh-delta-neutral">
                    <FaMinus />
                  </div>
                )}
                {isLatest && <span className="sh-latest-badge">Latest</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
