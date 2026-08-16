import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FaGithub,
  FaSearch,
  FaShieldAlt,
  FaCode,
  FaBug,
  FaRobot,
  FaFileAlt,
  FaSync,
  FaDownload,
  FaExclamationTriangle,
  FaCheckCircle,
  FaStar,
  FaCodeBranch,
  FaUsers,
  FaHashtag,
  FaTimes,
  FaGlobe,
  FaBox,
  FaHistory,
} from "react-icons/fa"
import API from "../../api/api"
import { githubStartScan, githubGetResults } from "../../services/scanService"
import { useAuth } from "../../contexts/AuthContext"
import VerificationBanner from "../../components/Auth/VerificationBanner"
import RepositoryHealth from "../../components/GitHubScanner/RepositoryHealth/RepositoryHealth"
import RepositoryAnalytics from "../../components/GitHubScanner/RepositoryAnalytics/RepositoryAnalytics"
import ScanControl from "../../components/GitHubScanner/ScanControl/ScanControl"
import ScanDashboard from "../../components/GitHubScanner/ScanProgress/ScanDashboard"
import VulnerabilityExplorer from "../../components/GitHubScanner/VulnerabilityExplorer/VulnerabilityExplorer"
import DependencyDashboard from "../../components/GitHubScanner/DependencyDashboard/DependencyDashboard"
import ExecutiveDashboard from "../../components/GitHubScanner/ExecutiveDashboard/ExecutiveDashboard"
import FindingsExplorer from "../../components/GitHubScanner/FindingsExplorer/FindingsExplorer"
import FileExplorer from "../../components/GitHubScanner/VSCodeViewer/FileExplorer"
import CodeViewer from "../../components/GitHubScanner/VSCodeViewer/CodeViewer"
import ProblemsPanel from "../../components/GitHubScanner/VSCodeViewer/ProblemsPanel"
import AIFixPanel from "../../components/GitHubScanner/VSCodeViewer/AIFixPanel"
import VulnerabilityIntelligence from "../../components/GitHubScanner/VulnerabilityIntelligence/VulnerabilityIntelligence"
import SecurityHistory from "../../components/GitHubScanner/SecurityHistory/SecurityHistory"
import RiskDashboard from "../../components/GitHubScanner/RiskDashboard/RiskDashboard"
import { mapScanResult } from "../../utils/scanMapper"
import "./GitHubScanner.css"

/* ── Tab Configuration ────────────────────────────────────── */
const TABS = [
  { id: "overview", label: "Overview", icon: FaSearch },
  { id: "scan", label: "Scan", icon: FaShieldAlt },
  { id: "findings", label: "Findings", icon: FaBug },
  { id: "ai", label: "AI Fix", icon: FaRobot },
  { id: "reports", label: "Reports", icon: FaFileAlt },
  { id: "history", label: "History", icon: FaHistory },
]

function GitHubScanner() {
  const { user } = useAuth()
  const unverified = user && !user.is_verified
  const [repoUrl, setRepoUrl] = useState("")
  const [validatedUrl, setValidatedUrl] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [scanActive, setScanActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState(null)
  const [loadingFile, setLoadingFile] = useState(false)
  const [activeFinding, setActiveFinding] = useState(null)
  const [aiFix, setAiFix] = useState(null)
  const [loadingFix, setLoadingFix] = useState(false)
  const [selectedFinding, setSelectedFinding] = useState(null)
  const [history, setHistory] = useState([])

  /* ── URL Validation Flow ─────────────────────────────────── */
  const handleValidate = async () => {
    if (!repoUrl.trim()) return
    if (unverified) {
      alert("Please verify your email before running scans.")
      return
    }
    try {
      setLoading(true)
      const res = await API.post("/github/validate", { repository: repoUrl })
      setValidatedUrl(res.data)
    } catch (err) {
      const msg = err.response?.data?.detail || "Validation failed. Check the URL."
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  /* ── Full Scan Flow (Background with Progress Tracking) ───── */
  const [currentScanId, setCurrentScanId] = useState(null)
  const scanIdRef = useRef(null)

  const handleScan = async () => {
    if (unverified) {
      alert("Please verify your email before running scans.")
      return
    }
    try {
      setLoading(true)
      setScanActive(true)

      // Start background scan — returns immediately with scan_id
      const response = await githubStartScan(repoUrl)

      setCurrentScanId(response.scan_id)
      scanIdRef.current = response.scan_id
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.detail || "Scan Failed to start")
      setScanActive(false)
    } finally {
      setLoading(false)
    }
  }

  /* ── PDF Download ────────────────────────────────────────── */
  const downloadReport = async () => {
    try {
      const response = await API.post(
        "/github/generate-pdf",
        { report: result?.scan },
        { responseType: "blob" }
      )
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "CyberShield_Report.pdf")
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
    }
  }

  /* ── File Loading ────────────────────────────────────────── */
  const loadFile = async (file) => {
    try {
      setLoadingFile(true)
      setSelectedFile(file)
      setActiveFinding(null)
      setAiFix(null)
      const res = await API.get("/github/file-content", {
        params: { scan_id: result.scan_id, file }
      })
      setFileContent(res.data)
    } catch (err) {
      console.error("Failed to load file:", err)
    } finally {
      setLoadingFile(false)
    }
  }

  /* ── AI Fix Loading ────────────────────────────────────────── */
  const loadAiFix = async (issue) => {
    try {
      setLoadingFix(true)
      setAiFix(null)
      const res = await API.get("/github/ai-fix", {
        params: {
          scan_id: result.scan_id,
          file: issue.file,
          type: issue.type
        }
      })
      setAiFix(res.data)
    } catch (err) {
      console.error("Failed to load AI fix:", err)
    } finally {
      setLoadingFix(false)
    }
  }

  /* ── Auto-open first file after scan ─────────────────────── */
  useEffect(() => {
    if (result?.fileReport?.length && !selectedFile) {
      loadFile(result.fileReport[0].file)
    }
  }, [result])

  /* ── Load scan history when History tab is opened ─────────── */
  const loadHistory = async () => {
    if (!repoInfo.name) return
    try {
      const res = await API.get(`/github/history/${repoInfo.name}`)
      setHistory(res.data)
    } catch (err) {
      console.error("Failed to load history:", err)
    }
  }

  useEffect(() => {
    if (activeTab === "history" && result) {
      loadHistory()
    }
  }, [activeTab, result])

  /* ── Helpers ─────────────────────────────────────────────── */
  const getRiskColor = (level) => {
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

  const repoInfo = result?.repository || {}
  const riskDashboard = result?.scan || {}

  return (
    <div className="gs-page">
      <VerificationBanner />

      {/* ── Repository Header (constant) ──────────────────── */}
      {result && (
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
              <h1 className="gs-repo-name">{repoInfo.name || "Repository"}</h1>
              {repoInfo.description && (
                <p className="gs-repo-desc">{repoInfo.description}</p>
              )}
            </div>
          </div>

          <div className="gs-repo-header-stats">
            <div className="gs-stat-chip">
              <FaStar style={{ color: "#eab308" }} />
              <span>{(repoInfo.stars || 0).toLocaleString()}</span>
            </div>
            <div className="gs-stat-chip">
              <FaCodeBranch style={{ color: "#6366f1" }} />
              <span>{(repoInfo.forks || 0).toLocaleString()}</span>
            </div>
            <div className="gs-stat-chip">
              <FaHashtag style={{ color: "#06b6d4" }} />
              <span>{(repoInfo.issues || 0).toLocaleString()}</span>
            </div>
            <div className="gs-stat-chip">
              <FaUsers style={{ color: "#a855f7" }} />
              <span>{repoInfo.language || "Unknown"}</span>
            </div>
            <div className="gs-stat-chip">
              <FaGlobe style={{ color: "#06b6d4" }} />
              <span>{repoInfo.visibility ? repoInfo.visibility.charAt(0).toUpperCase() + repoInfo.visibility.slice(1) : "Public"}</span>
            </div>
            {riskDashboard.riskLevel && (
              <div
                className="gs-grade-badge"
                style={{ background: getRiskColor(riskDashboard.riskLevel) + "22", color: getRiskColor(riskDashboard.riskLevel) }}
              >
                {riskDashboard.riskLevel}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Tab Navigation ────────────────────────────────── */}
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

      {/* ── Tab Content ───────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            className="gs-tab-content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {result ? (
              <>
                <ExecutiveDashboard
                  repository={result.repository}
                  summary={result.scan}
                  findings={result.findings}
                  dependency={result.dependency}
                  aiReport={result.ai}
                  technologies={result.technologies}
                  fileReport={result.fileReport}
                  onNavigate={setActiveTab}
                />
                <RepositoryHealth
                  repository={result.repository}
                  technologies={result.technologies}
                  dependency={result.dependency}
                  topics={result.repository.topics || []}
                />
                <RepositoryAnalytics
                  repository={result.repository}
                  technologies={result.technologies}
                  dependencyReport={result.dependency}
                  scanSummary={result.scan}
                  findings={result.findings}
                  dependencyFindings={result.dependency?.findings || []}
                />
                <DependencyDashboard
                  dependencyReport={result.dependency}
                  dependencyFindings={result.dependency?.findings || []}
                />
              </>
            ) : (
              <div className="gs-empty-state">
                <FaGithub className="gs-empty-icon" />
                <h2>No Repository Loaded</h2>
                <p>Paste a GitHub repository URL and validate to get started.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "scan" && (
          <motion.div
            key="scan"
            className="gs-tab-content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <ScanControl
              repositoryUrl={repoUrl}
              onScanStart={handleScan}
              onScanPause={() => {}}
              onScanResume={() => {}}
              onScanCancel={() => setScanActive(false)}
              onScanRetry={handleScan}
              onExportResults={downloadReport}
              onShareResults={() => {}}
              onOpenReport={() => setActiveTab("reports")}
              scanStatus={scanActive ? "running" : "idle"}
            />

            {scanActive && currentScanId && (
              <ScanDashboard
                scanId={currentScanId}
                onScanComplete={async (data) => {
                  console.log("Scan Finished:", data)
                  setScanActive(false)
                  try {
                    const finalResult = await githubGetResults(scanIdRef.current)
                    const mapped = mapScanResult(finalResult)
                    console.log("Mapped Result:", mapped)
                    setResult(mapped)
                    setActiveTab("findings")
                  } catch (err) {
                    console.error("Failed to fetch results:", err)
                  }
                }}
              />
            )}

            {!scanActive && result && (
              <div className="gs-last-scan-card">
                <FaCheckCircle style={{ color: "#22c55e", fontSize: 28 }} />
                <div>
                  <p className="gs-last-scan-title">No Active Scan</p>
                  <p className="gs-last-scan-sub">Last scan completed. View findings in the Findings tab.</p>
                </div>
                <button className="gs-btn-outline" onClick={() => setActiveTab("findings")}>
                  View Report
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "findings" && (
          <motion.div
            key="findings"
            className="gs-tab-content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {result ? (
              <>
                {/* Risk Intelligence Dashboard */}
                <RiskDashboard riskDashboard={result.riskDashboard} />

                {/* Severity Cards */}
                {result.scan?.severity && (
                  <div className="gs-severity-grid">
                    {[
                      { label: "Critical", count: result.scan.severity.Critical || 0, color: "#ef4444", bg: "#ef444418" },
                      { label: "High", count: result.scan.severity.High || 0, color: "#f97316", bg: "#f9731618" },
                      { label: "Medium", count: result.scan.severity.Medium || 0, color: "#eab308", bg: "#eab30818" },
                      { label: "Low", count: result.scan.severity.Low || 0, color: "#22c55e", bg: "#22c55e18" },
                    ].map((s) => (
                      <div key={s.label} className="gs-severity-card" style={{ borderColor: s.color + "40", background: s.bg }}>
                        <span className="gs-severity-label" style={{ color: s.color }}>{s.label}</span>
                        <span className="gs-severity-count" style={{ color: s.color }}>{s.count}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* VS Code Style Vulnerability Explorer */}
                <VulnerabilityExplorer result={result} />

                {/* Security Findings Explorer */}
                <FindingsExplorer
                  fileReport={result.fileReport}
                />

                {/* VS Code Layout — File Explorer + Code Viewer + AI Fix */}
                <div className="vscode-layout">
                  <FileExplorer
                    files={result.fileReport}
                    selectedFile={selectedFile}
                    onSelectFile={loadFile}
                  />
                  <div className="vscode-center">
                    <CodeViewer
                      fileContent={fileContent}
                      loading={loadingFile}
                      fileReport={result.fileReport}
                      activeFinding={activeFinding}
                    />
                    {fileContent && (
                      <ProblemsPanel
                        findings={
                          (result.fileReport || [])
                            .find(f => f.file === fileContent.file)
                            ?.issues?.map(i => ({
                              ...i,
                              file: fileContent.file
                            })) || []
                        }
                        onSelect={(issue) => {
                          setActiveFinding(issue)
                          setSelectedFinding(issue)
                          loadAiFix(issue)
                        }}
                      />
                    )}
                  </div>
                  <AIFixPanel
                    aiFix={aiFix}
                    loading={loadingFix}
                  />
                  <VulnerabilityIntelligence
                    finding={selectedFinding}
                  />
                </div>


              </>
            ) : (
              <div className="gs-empty-state">
                <FaBug className="gs-empty-icon" />
                <h2>No Findings Yet</h2>
                <p>Run a scan to see vulnerability findings.</p>
                <button className="gs-btn-primary" onClick={() => setActiveTab("scan")}>
                  Go to Scan
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "ai" && (
          <motion.div
            key="ai"
            className="gs-tab-content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {result ? (
              <>
                {/* Risk Level Badge */}
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", padding: "0.85rem 1.25rem", borderRadius: "10px", display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                  <span style={{ color: "#94a3b8", fontWeight: 500 }}>Risk Level:</span>
                  <span className={`gs-badge gs-badge-${(result.ai?.riskLevel || result.scan?.riskLevel || "low").toLowerCase()}`}>
                    {result.ai?.riskLevel || result.scan?.riskLevel || "Unknown"}
                  </span>
                  {result.security_score !== undefined && (
                    <span style={{ marginLeft: "auto", color: "#38bdf8", fontWeight: "bold" }}>
                      Security Score: {result.security_score}/100
                    </span>
                  )}
                </div>

                {/* AI Security Report */}
                <div className="gs-card">
                  <h3 className="gs-card-title"><FaRobot /> AI Security Analysis</h3>
                  {result.ai?.summary && (
                    <div className="gs-ai-section">
                      <h4>Repository Summary</h4>
                      <p>{result.ai.summary}</p>
                    </div>
                  )}
                  {result.ai?.businessImpact?.length > 0 && (
                    <div className="gs-ai-section">
                      <h4>Business Impact</h4>
                      <ul className="gs-list">
                        {result.ai.businessImpact.map((impact, i) => (
                          <li key={i}>{impact}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Dependency Analysis */}
                {result.dependency && (
                  <div className="gs-card">
                    <h3 className="gs-card-title"><FaBox /> Dependency Analysis</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginTop: "0.75rem" }}>
                      <div style={{ background: "#0f172a", padding: "0.75rem", borderRadius: "8px", border: "1px solid #1e293b" }}>
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Packages Scanned</span>
                        <p style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#f8fafc", margin: "0.25rem 0 0" }}>{result.dependency.totalPackages ?? 0}</p>
                      </div>
                      <div style={{ background: "#0f172a", padding: "0.75rem", borderRadius: "8px", border: "1px solid #1e293b" }}>
                        <span style={{ fontSize: "0.8rem", color: "#f59e0b" }}>Outdated</span>
                        <p style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#f59e0b", margin: "0.25rem 0 0" }}>{result.dependency.outdated ?? 0}</p>
                      </div>
                      <div style={{ background: "#0f172a", padding: "0.75rem", borderRadius: "8px", border: "1px solid #1e293b" }}>
                        <span style={{ fontSize: "0.8rem", color: "#ef4444" }}>Risky</span>
                        <p style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#ef4444", margin: "0.25rem 0 0" }}>{result.dependency.risky ?? 0}</p>
                      </div>
                      <div style={{ background: "#0f172a", padding: "0.75rem", borderRadius: "8px", border: "1px solid #1e293b" }}>
                        <span style={{ fontSize: "0.8rem", color: "#a855f7" }}>Unpinned</span>
                        <p style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#a855f7", margin: "0.25rem 0 0" }}>{result.dependency.unpinned ?? 0}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Executive Summary */}
                {result.ai?.summary && (
                  <div className="gs-card gs-card-accent">
                    <h3 className="gs-card-title"><FaFileAlt /> Executive Summary</h3>
                    <p className="gs-pre-line">{result.ai.summary}</p>
                  </div>
                )}

                {/* Recommendations */}
                {result.ai?.recommendations?.length > 0 && (
                  <div className="gs-card">
                    <h3 className="gs-card-title"><FaCheckCircle /> Recommendations</h3>
                    <ol className="gs-ordered-list">
                      {result.ai.recommendations.map((rec, i) => (
                        <li key={i}>
                          {typeof rec === "string" ? rec : (rec.recommendation || rec.text || JSON.stringify(rec))}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Score Card */}
                {result.score_card && (
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
              </>
            ) : (
              <div className="gs-empty-state">
                <FaRobot className="gs-empty-icon" />
                <h2>No AI Analysis</h2>
                <p>Run a scan to receive AI-powered security insights.</p>
                <button className="gs-btn-primary" onClick={() => setActiveTab("scan")}>
                  Go to Scan
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "reports" && (
          <motion.div
            key="reports"
            className="gs-tab-content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {result ? (
              <>
                <div className="gs-card">
                  <h3 className="gs-card-title"><FaFileAlt /> Executive Report</h3>
                  <div className="gs-report-meta">
                    <div>
                      <span className="gs-report-label">Repository</span>
                      <span className="gs-report-value">{repoInfo.name}</span>
                    </div>
                    <div>
                      <span className="gs-report-label">Risk Level</span>
                      <span className="gs-report-value" style={{ color: getRiskColor(result.scan?.riskLevel || result.ai?.riskLevel) }}>
                        {result.scan?.riskLevel || result.ai?.riskLevel || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="gs-report-label">Security Score</span>
                      <span className="gs-report-value" style={{ color: "#38bdf8" }}>
                        {result.security_score ?? "—"}/100
                      </span>
                    </div>
                    <div>
                      <span className="gs-report-label">Files Scanned</span>
                      <span className="gs-report-value">{result.scan?.filesWithIssues ?? result.fileReport?.length ?? "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Severity Breakdown Table */}
                {result.scan?.severity && (
                  <div className="gs-card">
                    <h3 className="gs-card-title"><FaShieldAlt /> Severity Breakdown</h3>
                    <div className="gs-table-wrap">
                      <table className="gs-table">
                        <thead>
                          <tr>
                            <th>Severity</th>
                            <th>Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(result.scan.severity).map(([sev, count]) => (
                            <tr key={sev}>
                              <td>
                                <span className={`gs-badge gs-badge-${sev.toLowerCase()}`}>
                                  {sev}
                                </span>
                              </td>
                              <td className="gs-text-bold">{count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {result.ai?.summary && (
                  <div className="gs-card gs-card-accent">
                    <h3 className="gs-card-title"><FaFileAlt /> Executive Summary</h3>
                    <p className="gs-pre-line">{result.ai.summary}</p>
                  </div>
                )}

                {result.ai?.summary && (
                  <div className="gs-card">
                    <h3 className="gs-card-title"><FaRobot /> AI Report Summary</h3>
                    <p>{result.ai.summary}</p>
                  </div>
                )}

                <div className="gs-card">
                  <h3 className="gs-card-title"><FaDownload /> Export</h3>
                  <button className="gs-btn-primary gs-btn-lg" onClick={downloadReport} disabled={loading}>
                    <FaDownload /> Download PDF Report
                  </button>
                </div>
              </>
            ) : (
              <div className="gs-empty-state">
                <FaFileAlt className="gs-empty-icon" />
                <h2>No Report Available</h2>
                <p>Run a scan to generate a security report.</p>
                <button className="gs-btn-primary" onClick={() => setActiveTab("scan")}>
                  Go to Scan
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div
            key="history"
            className="gs-tab-content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {result ? (
              <SecurityHistory history={history} />
            ) : (
              <div className="gs-empty-state">
                <FaHistory className="gs-empty-icon" />
                <h2>No Scan History</h2>
                <p>Run a scan to start tracking security trends over time.</p>
                <button className="gs-btn-primary" onClick={() => setActiveTab("scan")}>
                  Go to Scan
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── URL Input Bar (shown when no result yet) ──────── */}
      {!result && (
        <div className="gs-url-bar">
          <div className="gs-url-input-wrap">
            <FaGithub className="gs-url-icon" />
            <input
              type="text"
              placeholder="Paste a GitHub repository URL..."
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleValidate()}
              className="gs-url-input"
            />
            {repoUrl && (
              <button className="gs-url-clear" onClick={() => { setRepoUrl(""); setValidatedUrl(null) }}>
                <FaTimes />
              </button>
            )}
          </div>
          <button
            className="gs-btn-primary"
            onClick={handleValidate}
            disabled={loading || !repoUrl.trim() || unverified}
          >
            {loading ? <><FaSync className="gs-spin" /> Validating...</> : <><FaSearch /> Validate</>}
          </button>
        </div>
      )}

      {/* ── Validated Repository Preview ───────────────────── */}
      {validatedUrl && !result && (
        <motion.div
          className="gs-preview-card"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="gs-preview-info">
            <FaGithub style={{ fontSize: 28, color: "#e2e8f0" }} />
            <div>
              <p className="gs-preview-name">{validatedUrl.full_name || validatedUrl.name || repoUrl}</p>
              {validatedUrl.description && <p className="gs-preview-desc">{validatedUrl.description}</p>}
            </div>
          </div>
          <button className="gs-btn-primary gs-btn-lg" onClick={handleScan} disabled={loading || unverified}>
            {loading ? <><FaSync className="gs-spin" /> Scanning...</> : <><FaShieldAlt /> Start Scan</>}
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default GitHubScanner
