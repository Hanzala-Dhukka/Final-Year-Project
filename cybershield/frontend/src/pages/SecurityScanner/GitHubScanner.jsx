
import { useState } from "react"
import API from "../api/api"

function GitHubScanner() {

  const [repoUrl, setRepoUrl] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeSecretFilter, setActiveSecretFilter] = useState("all")

  const handleScan = async () => {
    try {
      setLoading(true)
      const response = await API.post(
        "/github/scan-repository",
        { repo_url: repoUrl }
      )
      setResult(response.data)
    } catch (error) {
      console.log(error)
      const message = error.response?.data?.detail || "Repository scan failed"
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async () => {
    try {
      const response = await API.post(
        "/github/generate-pdf",
        { report: result.scan_summary },
        { responseType: "blob" }
      )

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "CyberShield_Report.pdf")
      document.body.appendChild(link)
      link.click()
    } catch (error) {
      console.log(error)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical": return "text-red-600"
      case "high": return "text-orange-500"
      case "medium": return "text-yellow-500"
      case "low": return "text-green-600"
      default: return "text-gray-600"
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-4xl font-bold mb-8">GitHub Security Scanner</h1>

      <div className="flex gap-4 mb-10">
        <input
          type="text"
          placeholder="Enter GitHub repository URL"
          className="border p-3 rounded w-[500px]"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />
        <button
          onClick={handleScan}
          className="bg-black text-white px-6 rounded"
        >
          {loading ? "Scanning..." : "Scan Repository"}
        </button>
      </div>

      {result && (
        <div className="space-y-8">
          {/* ── Top Summary Cards ───────────────────────────────────── */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-3xl font-bold mb-4">
              {result.repository_info?.repository || result.repository}
            </h2>
            {result.repository_info?.description && (
              <p className="mt-2 text-gray-500 text-sm mb-6">{result.repository_info.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 uppercase font-bold">Files Scanned</p>
                <p className="text-xl font-black">{result.risk_dashboard?.files_scanned || "—"}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 uppercase font-bold">Risk Score</p>
                <p className={`text-xl font-black ${getSeverityColor(result.risk_dashboard?.risk_level)}`}>
                  {result.risk_dashboard?.risk_score?.toFixed(1) || "—"}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 uppercase font-bold">Security Grade</p>
                <p className={`text-xl font-black ${
                  result.risk_dashboard?.security_grade === "A" ? "text-green-600" :
                  result.risk_dashboard?.security_grade === "B" ? "text-green-500" :
                  result.risk_dashboard?.security_grade === "C" ? "text-yellow-500" :
                  result.risk_dashboard?.security_grade === "D" ? "text-orange-500" :
                  result.risk_dashboard?.security_grade === "F" ? "text-red-600" :
                  "text-gray-600"
                }`}>
                  {result.risk_dashboard?.security_grade || "—"}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 uppercase font-bold">Stars</p>
                <p className="text-xl font-black text-yellow-500">
                  ⭐ {result.repository_info?.stars ?? "—"}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 uppercase font-bold">Forks</p>
                <p className="text-xl font-black text-blue-500">
                  🍴 {result.repository_info?.forks ?? "—"}
                </p>
              </div>
            </div>

            {/* Repository Health Section */}
            {result.repository_health && (
              <div className="border-t pt-4">
                <h3 className="font-bold text-lg mb-3">Repository Health</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(result.repository_health).map(([key, value]) => (
                    <div key={key} className="p-2 bg-gray-50 rounded text-sm">
                      <p className="text-xs text-gray-400 font-bold uppercase">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className={`font-semibold ${
                        value === "Critical" ? "text-red-600" :
                        value === "Poor" ? "text-orange-500" :
                        value === "Moderate" ? "text-yellow-500" :
                        "text-green-600"
                      }`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Severity Count Cards ───────────────────────────────── */}
          {result.severity_summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-50 border border-red-200 p-6 rounded-xl shadow-sm">
                <p className="text-xs text-red-400 uppercase font-bold mb-1">Critical</p>
                <p className="text-4xl font-black text-red-600">{result.severity_summary.critical}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl shadow-sm">
                <p className="text-xs text-orange-400 uppercase font-bold mb-1">High</p>
                <p className="text-4xl font-black text-orange-600">{result.severity_summary.high}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl shadow-sm">
                <p className="text-xs text-yellow-400 uppercase font-bold mb-1">Medium</p>
                <p className="text-4xl font-black text-yellow-600">{result.severity_summary.medium}</p>
              </div>
              <div className="bg-green-50 border border-green-200 p-6 rounded-xl shadow-sm">
                <p className="text-xs text-green-400 uppercase font-bold mb-1">Low</p>
                <p className="text-4xl font-black text-green-600">{result.severity_summary.low}</p>
              </div>
            </div>
          )}

          {/* ── Technologies Section ───────────────────────────────────── */}
          {result.technologies && Object.values(result.technologies).some(v => v.length > 0) && (
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-2xl font-bold mb-5">🔧 Repository Technologies</h2>
              <div className="space-y-4">
                {[
                  { key: "language", label: "Programming Language", color: "bg-blue-100 text-blue-800" },
                  { key: "frontend", label: "Frontend", color: "bg-purple-100 text-purple-800" },
                  { key: "backend", label: "Backend", color: "bg-green-100 text-green-800" },
                  { key: "database", label: "Database", color: "bg-orange-100 text-orange-800" },
                  { key: "devops", label: "DevOps", color: "bg-gray-100 text-gray-800" },
                ].map(({ key, label, color }) => {
                  const items = result.technologies[key] || []
                  if (items.length === 0) return null
                  return (
                    <div key={key} className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold text-gray-500 w-36 shrink-0">{label}</span>
                      <div className="flex flex-wrap gap-2">
                        {items.map((tech, i) => (
                          <span key={i} className={`px-3 py-1 rounded-full text-sm font-semibold ${color}`}>
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Secrets Detected ─────────────────────────────────────── */}
          {result.secret_summary && (
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-2xl font-bold mb-5">🔐 Secrets Detected</h2>

              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { id: "all", label: "All" },
                  { id: "critical", label: "Critical" },
                  { id: "high", label: "High" },
                  { id: "medium", label: "Medium" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveSecretFilter(f.id)}
                    className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                      activeSecretFilter === f.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {result.advanced_secrets && result.advanced_secrets.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 border-b">
                          Secret Type
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 border-b">
                          File
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 border-b">
                          Line
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 border-b">
                          Severity
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 border-b">
                          Recommendation
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.advanced_secrets
                        .filter(secret => activeSecretFilter === "all" || secret.severity?.toLowerCase() === activeSecretFilter)
                        .map((secret, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-800">{secret.type}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 font-mono">{secret.file}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{secret.line}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                secret.severity === "Critical" ? "bg-red-100 text-red-700" :
                                secret.severity === "High" ? "bg-orange-100 text-orange-700" :
                                secret.severity === "Medium" ? "bg-yellow-100 text-yellow-700" :
                                "bg-green-100 text-green-700"
                              }`}>
                                {secret.severity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{secret.recommendation}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(!result.advanced_secrets || result.advanced_secrets.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg font-semibold">No secrets detected</p>
                  <p className="text-sm">No exposed credentials or secrets were found in the scanned files</p>
                </div>
              )}
            </div>
          )}

          {/* ── Category Summary and Charts Placeholders ─────────────── */}
          {result.category_summary && (
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-2xl font-bold mb-5">📊 Issue Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(result.category_summary).map(([key, count]) => (
                  <div key={key} className="border p-4 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">{key}</p>
                    <p className="text-2xl font-black">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Score Card ─────────────────────────────────────────────── */}
          {result.score_card && (
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-2xl font-bold mb-5">📋 Security Score Card</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(result.score_card).map(([key, score]) => (
                  <div key={key} className="border p-4 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">{key}</p>
                    <p className={`text-2xl font-black ${
                      parseInt(score.split("/")[0]) >= 80 ? "text-green-600" :
                      parseInt(score.split("/")[0]) >= 60 ? "text-yellow-500" :
                      parseInt(score.split("/")[0]) >= 40 ? "text-orange-500" :
                      "text-red-600"
                    }`}>
                      {score}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Top Risks ─────────────────────────────────────────────── */}
          {result.top_risks && result.top_risks.length > 0 && (
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-2xl font-bold mb-5">🚨 Top Risks</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 border-b">Risk</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 border-b">Severity</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 border-b">File</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 border-b">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.top_risks.map((risk, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{risk.title}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            risk.severity === "Critical" ? "bg-red-100 text-red-700" :
                            risk.severity === "High" ? "bg-orange-100 text-orange-700" :
                            risk.severity === "Medium" ? "bg-yellow-100 text-yellow-700" :
                            "bg-green-100 text-green-700"
                          }`}>
                            {risk.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{risk.file}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{risk.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Prioritized Recommendations ───────────────────────────── */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-2xl font-bold mb-5">✅ Prioritized Recommendations</h2>
              <ol className="list-decimal ml-6 space-y-3">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-gray-700 text-base">
                    <span className="font-bold">{rec.priority}.</span> {rec.recommendation}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* ── Executive Summary ─────────────────────────────────────── */}
          {result.executive_summary && (
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl shadow">
              <h2 className="text-2xl font-bold mb-3 text-yellow-800">📝 Executive Summary</h2>
              <p className="text-gray-800 whitespace-pre-line text-base">
                {result.executive_summary}
              </p>
            </div>
          )}

          {/* ── AI Report & Download Button ───────────────────────────── */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-3xl font-bold mb-6">AI Security Report</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xl font-semibold">
                  Risk Level:
                  <span className={`ml-2 ${getSeverityColor(result.risk_dashboard?.risk_level)}`}>
                    {result.risk_dashboard?.risk_level || "Unknown"}
                  </span>
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold">Repository Summary:</h3>
                <p className="mt-2 text-gray-700">{result.ai_report?.summary}</p>
              </div>
              {result.ai_report?.business_impact?.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold">Business Impact:</h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-700">
                    {result.ai_report.business_impact.map((impact, i) => (
                      <li key={i}>{impact}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={downloadReport}
                disabled={loading}
                className="bg-black text-white px-8 py-3 rounded font-bold mt-4 disabled:opacity-50 hover:bg-gray-800 transition-colors"
              >
                Download PDF Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GitHubScanner
