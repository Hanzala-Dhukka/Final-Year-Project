import { useEffect, useState } from "react"
import API from "../api/api"

function GitHubScanHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await API.get("github/scan-history")
        setHistory(response.data)
      } catch (err) {
        console.error(err)
        setError("Failed to load scan history.")
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const getRiskColor = (score) => {
    if (score === undefined || score === null) return "#6b7280"
    if (score >= 7) return "#ef4444"
    if (score >= 4) return "#f59e0b"
    return "#22c55e"
  }

  const getRiskLabel = (score) => {
    if (score === undefined || score === null) return "Unknown"
    if (score >= 7) return "High"
    if (score >= 4) return "Medium"
    return "Low"
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "40px 24px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        <h1 style={{
          fontSize: "2rem",
          fontWeight: "700",
          color: "#f1f5f9",
          marginBottom: "8px"
        }}>
          GitHub Scan History
        </h1>
        <p style={{ color: "#94a3b8", marginBottom: "32px" }}>
          All repository security scans associated with your account.
        </p>

        {loading && (
          <p style={{ color: "#94a3b8", textAlign: "center", marginTop: "60px" }}>
            Loading scans...
          </p>
        )}

        {error && (
          <p style={{ color: "#ef4444", textAlign: "center", marginTop: "60px" }}>
            {error}
          </p>
        )}

        {!loading && !error && history.length === 0 && (
          <p style={{ color: "#94a3b8", textAlign: "center", marginTop: "60px" }}>
            No scans found. Run a GitHub scan to see results here.
          </p>
        )}

        <div style={{ display: "grid", gap: "16px" }}>
          {history.map((scan) => {
            const riskScore = scan.risk_score
            const color = getRiskColor(riskScore)
            const label = getRiskLabel(riskScore)
            const repo = scan.repository || scan.repo_name || "Unknown Repository"
            const vulns = scan.vulnerabilities_found ?? scan.findings_count ?? "N/A"
            const files = scan.scanned_files ?? "N/A"

            return (
              <div
                key={scan._id}
                style={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#f1f5f9", margin: 0 }}>
                      {repo}
                    </h2>
                    {scan.repo_url && (
                      <a
                        href={scan.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: "0.8rem", color: "#60a5fa", textDecoration: "none" }}
                      >
                        {scan.repo_url}
                      </a>
                    )}
                  </div>
                  <span style={{
                    background: color + "22",
                    color: color,
                    border: `1px solid ${color}44`,
                    borderRadius: "999px",
                    padding: "4px 14px",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    whiteSpace: "nowrap"
                  }}>
                    {label} Risk
                  </span>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ color: "#64748b", fontSize: "0.75rem", margin: "0 0 2px" }}>Files Scanned</p>
                    <p style={{ color: "#f1f5f9", fontWeight: "600", fontSize: "1.1rem", margin: 0 }}>{files}</p>
                  </div>
                  <div>
                    <p style={{ color: "#64748b", fontSize: "0.75rem", margin: "0 0 2px" }}>Vulnerabilities</p>
                    <p style={{ color: vulns > 0 ? "#f87171" : "#4ade80", fontWeight: "600", fontSize: "1.1rem", margin: 0 }}>{vulns}</p>
                  </div>
                  <div>
                    <p style={{ color: "#64748b", fontSize: "0.75rem", margin: "0 0 2px" }}>Risk Score</p>
                    <p style={{ color: color, fontWeight: "600", fontSize: "1.1rem", margin: 0 }}>
                      {riskScore !== undefined && riskScore !== null ? riskScore : "N/A"}
                    </p>
                  </div>
                  {scan.secret_summary && (
                    <div>
                      <p style={{ color: "#64748b", fontSize: "0.75rem", margin: "0 0 2px" }}>Secrets Found</p>
                      <p style={{ color: scan.secret_summary.total > 0 ? "#f87171" : "#4ade80", fontWeight: "600", fontSize: "1.1rem", margin: 0 }}>
                        {scan.secret_summary.total}
                      </p>
                    </div>
                  )}
                </div>

                {/* Secret Summary */}
                {scan.secret_summary && scan.secret_summary.total > 0 && (
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
                    <span style={{ background: "#991b1b22", color: "#f87171", border: "1px solid #991b1b44", borderRadius: "6px", padding: "4px 8px", fontSize: "0.75rem", fontWeight: "600" }}>
                      Critical: {scan.secret_summary.critical}
                    </span>
                    <span style={{ background: "#ea580c22", color: "#fb923c", border: "1px solid #ea580c44", borderRadius: "6px", padding: "4px 8px", fontSize: "0.75rem", fontWeight: "600" }}>
                      High: {scan.secret_summary.high}
                    </span>
                    <span style={{ background: "#ca8a0422", color: "#facc15", border: "1px solid #ca8a0444", borderRadius: "6px", padding: "4px 8px", fontSize: "0.75rem", fontWeight: "600" }}>
                      Medium: {scan.secret_summary.medium}
                    </span>
                  </div>
                )}

                {/* Date */}
                <p style={{ color: "#475569", fontSize: "0.8rem", margin: 0 }}>
                  Scanned on: {scan.created_at ? new Date(scan.created_at).toLocaleString() : "Unknown"}
                </p>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

export default GitHubScanHistory
