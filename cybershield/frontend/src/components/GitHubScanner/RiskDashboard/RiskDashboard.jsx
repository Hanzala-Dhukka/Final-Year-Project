import { CircularProgressbar, buildStyles } from "react-circular-progressbar"
import "react-circular-progressbar/dist/styles.css"
import {
  FaShieldAlt,
  FaFire,
  FaExclamationTriangle,
  FaBug,
  FaFileCode,
} from "react-icons/fa"
import "./RiskDashboard.css"

function scoreColor(score) {
  if (score >= 80) return "#22c55e"
  if (score >= 60) return "#eab308"
  if (score >= 40) return "#f97316"
  return "#ef4444"
}

function levelColor(level) {
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

function gradeLabel(score) {
  if (score >= 90) return "A"
  if (score >= 80) return "B"
  if (score >= 70) return "C"
  if (score >= 60) return "D"
  return "F"
}

export default function RiskDashboard({ riskDashboard }) {
  if (!riskDashboard) return null

  const score = riskDashboard.overall_score ?? 0
  const queue = riskDashboard.priority_queue || []
  const dist = riskDashboard.severity_distribution || {}
  const total = riskDashboard.total_findings || 0
  const color = scoreColor(score)
  const grade = gradeLabel(score)

  const maxBar = Math.max(dist.Critical || 0, dist.High || 0, dist.Medium || 0, dist.Low || 0, 1)

  return (
    <div className="rd-dashboard">
      {/* Top Row: Score + Distribution */}
      <div className="rd-top-row">
        {/* Score Card */}
        <div className="rd-score-card">
          <div className="rd-gauge-wrap">
            <CircularProgressbar
              value={score}
              text={`${score}`}
              styles={buildStyles({
                textSize: "28px",
                pathColor: color,
                textColor: color,
                trailColor: "#1e293b",
              })}
            />
          </div>
          <div className="rd-score-meta">
            <span className="rd-grade" style={{ color }}>Grade {grade}</span>
            <span className="rd-total">{total} findings</span>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="rd-dist-card">
          <h3 className="rd-card-title">
            <FaExclamationTriangle /> Risk Distribution
          </h3>
          {[
            { label: "Critical", count: dist.Critical || 0, color: "#ef4444" },
            { label: "High", count: dist.High || 0, color: "#f97316" },
            { label: "Medium", count: dist.Medium || 0, color: "#eab308" },
            { label: "Low", count: dist.Low || 0, color: "#22c55e" },
          ].map((s) => (
            <div className="rd-dist-row" key={s.label}>
              <span className="rd-dist-label" style={{ color: s.color }}>{s.label}</span>
              <div className="rd-dist-bar-bg">
                <div
                  className="rd-dist-bar"
                  style={{
                    width: `${(s.count / maxBar) * 100}%`,
                    background: s.color,
                  }}
                />
              </div>
              <span className="rd-dist-count">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Fix Queue */}
      {queue.length > 0 && (
        <div className="rd-queue-section">
          <h3 className="rd-card-title">
            <FaFire /> Priority Fix Queue
          </h3>
          <div className="rd-queue-list">
            {queue.map((item, index) => {
              const lc = levelColor(item.risk_level)
              const isCritical = item.risk_level?.toLowerCase() === "critical"
              return (
                <div
                  className={`rd-queue-item ${isCritical ? "rd-queue-critical" : ""}`}
                  key={index}
                >
                  <div className="rd-queue-rank">{index + 1}</div>
                  <div className="rd-queue-info">
                    <div className="rd-queue-type">
                      <FaBug style={{ color: lc, marginRight: 6 }} />
                      {item.type}
                    </div>
                    <div className="rd-queue-file">
                      <FaFileCode style={{ marginRight: 4 }} />
                      {item.file}
                    </div>
                    {item.intelligence?.impact && (
                      <div className="rd-queue-impact">
                        {item.intelligence.impact}
                      </div>
                    )}
                  </div>
                  <div className="rd-queue-right">
                    <span
                      className="rd-risk-badge"
                      style={{ background: lc + "22", color: lc }}
                    >
                      {item.risk_level}
                    </span>
                    <span className="rd-risk-score" style={{ color: lc }}>
                      {item.risk_score}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
