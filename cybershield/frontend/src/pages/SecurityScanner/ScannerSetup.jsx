import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  FaGithub,
  FaSearch,
  FaShieldAlt,
  FaKey,
  FaBox,
  FaBug,
  FaRobot,
  FaServer,
  FaHistory,
  FaCogs,
  FaFileAlt,
  FaPlay,
  FaCheckCircle,
  FaSpinner,
  FaSync,
  FaTimes,
  FaClock,
  FaStar,
  FaCodeBranch,
  FaFolder,
} from "react-icons/fa"
import API from "../../api/api"
import "./ScannerSetup.css"

const SCAN_TYPES = [
  { id: "full", label: "Full Security Audit", desc: "Complete security analysis" },
  { id: "quick", label: "Quick Scan", desc: "Essential checks only" },
  { id: "secrets", label: "Secret Detection", desc: "Find exposed credentials" },
  { id: "owasp", label: "OWASP Top 10", desc: "Web vulnerability patterns" },
]

const MODULES = [
  { id: "secrets", title: "Secret Detection", desc: "Detect API keys and credentials", icon: FaKey, color: "#f59e0b" },
  { id: "deps", title: "Dependency Scan", desc: "Find vulnerable packages", icon: FaBox, color: "#22c55e" },
  { id: "owasp", title: "OWASP Top 10", desc: "Security vulnerability analysis", icon: FaShieldAlt, color: "#8b5cf6" },
  { id: "ai", title: "AI Code Analysis", desc: "AI powered security review", icon: FaRobot, color: "#a855f7" },
  { id: "static", title: "Static Analysis (SAST)", desc: "Source code vulnerabilities", icon: FaSearch, color: "#3b82f6" },
  { id: "docker", title: "Container Scan", desc: "Docker image vulnerabilities", icon: FaServer, color: "#06b6d4" },
  { id: "git", title: "Git History Scan", desc: "Secrets in commit history", icon: FaHistory, color: "#ec4899" },
  { id: "config", title: "Config/IaC Scan", desc: "Terraform, K8s, CloudFormation", icon: FaCogs, color: "#ef4444" },
  { id: "license", title: "License Compliance", desc: "OSS license violations", icon: FaFileAlt, color: "#64748b" },
]

const BRANCHES = ["main", "master", "develop", "dev"]

export default function ScannerSetup() {
  const navigate = useNavigate()
  const [repoUrl, setRepoUrl] = useState("")
  const [branch, setBranch] = useState("main")
  const [scanType, setScanType] = useState("full")
  const [selectedModules, setSelectedModules] = useState(
    MODULES.filter((m) => ["secrets", "deps", "owasp", "ai"].includes(m.id)).map((m) => m.id)
  )
  const [repoPreview, setRepoPreview] = useState(null)
  const [validating, setValidating] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState("")
  const [recentScans, setRecentScans] = useState([])

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const res = await API.get("/scanner/my-scans")
        setRecentScans(res.data?.scans || [])
      } catch {
        // silent
      }
    }
    loadRecent()
  }, [])

  const handleValidate = async () => {
    if (!repoUrl.trim()) return
    setError("")
    setValidating(true)
    setRepoPreview(null)
    try {
      const res = await API.post("/scanner/analyze-repository", { repo_url: repoUrl, branch })
      setRepoPreview(res.data)
      if (res.data.branches?.length) {
        // update branch options if returned
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to validate repository. Check the URL.")
    } finally {
      setValidating(false)
    }
  }

  const handleStartScan = async () => {
    if (!repoPreview) return
    setScanning(true)
    setError("")
    try {
      const res = await API.post("/scanner/start", {
        repo_url: repoUrl,
        branch,
        scan_type: scanType,
        modules: selectedModules,
      })
      const scanId = res.data?.scan_id || res.data?.id
      navigate(`/scanner/progress/${scanId}`)
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to start scan.")
      setScanning(false)
    }
  }

  const toggleModule = (id) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  return (
    <div className="ss-page">
      {/* ── Hero ───────────────────────────────────────────── */}
      <motion.div
        className="ss-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="ss-hero-icon">
          <FaShieldAlt />
        </div>
        <h1 className="ss-hero-title">GitHub Security Scanner</h1>
        <p className="ss-hero-sub">Analyze repositories for vulnerabilities, secrets and security risks</p>
      </motion.div>

      {/* ── Main Grid ──────────────────────────────────────── */}
      <div className="ss-grid">
        {/* Left: Input + Options */}
        <motion.div
          className="ss-left"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Repository URL Input */}
          <div className="ss-card">
            <label className="ss-label">Repository URL</label>
            <div className="ss-input-row">
              <div className="ss-input-wrap">
                <FaGithub className="ss-input-icon" />
                <input
                  type="text"
                  placeholder="https://github.com/user/project"
                  value={repoUrl}
                  onChange={(e) => { setRepoUrl(e.target.value); setRepoPreview(null) }}
                  onKeyDown={(e) => e.key === "Enter" && !repoPreview && handleValidate()}
                  className="ss-input"
                />
                {repoUrl && (
                  <button className="ss-clear" onClick={() => { setRepoUrl(""); setRepoPreview(null); setError("") }}>
                    <FaTimes />
                  </button>
                )}
              </div>
              {!repoPreview && (
                <button
                  className="ss-btn-validate"
                  onClick={handleValidate}
                  disabled={validating || !repoUrl.trim()}
                >
                  {validating ? <><FaSync className="ss-spin" /> Checking...</> : <><FaSearch /> Validate</>}
                </button>
              )}
            </div>

            {/* Branch + Scan Type */}
            <div className="ss-options-row">
              <div className="ss-option">
                <label className="ss-label-sm">Branch</label>
                <select className="ss-select" value={branch} onChange={(e) => setBranch(e.target.value)}>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="ss-option">
                <label className="ss-label-sm">Scan Type</label>
                <select className="ss-select" value={scanType} onChange={(e) => setScanType(e.target.value)}>
                  {SCAN_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {error && <p className="ss-error">{error}</p>}
          </div>

          {/* Repository Preview */}
          {repoPreview && (
            <motion.div
              className="ss-card ss-preview"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="ss-preview-header">
                <FaGithub className="ss-preview-icon" />
                <div>
                  <p className="ss-preview-name">{repoPreview.name || repoUrl}</p>
                  {repoPreview.description && <p className="ss-preview-desc">{repoPreview.description}</p>}
                </div>
                <FaCheckCircle className="ss-preview-check" />
              </div>
              <div className="ss-preview-stats">
                {repoPreview.language && (
                  <span className="ss-preview-chip">{repoPreview.language}</span>
                )}
                {repoPreview.stars != null && (
                  <span className="ss-preview-chip"><FaStar /> {repoPreview.stars.toLocaleString()}</span>
                )}
                {repoPreview.branch && (
                  <span className="ss-preview-chip"><FaCodeBranch /> {repoPreview.branch}</span>
                )}
                {repoPreview.files != null && (
                  <span className="ss-preview-chip"><FaFolder /> {repoPreview.files.toLocaleString()} files</span>
                )}
              </div>
            </motion.div>
          )}

          {/* Scan Modules */}
          <div className="ss-card">
            <label className="ss-label">Scan Modules</label>
            <div className="ss-modules">
              {MODULES.map((mod) => {
                const Icon = mod.icon
                const active = selectedModules.includes(mod.id)
                return (
                  <button
                    key={mod.id}
                    className={`ss-module ${active ? "ss-module-active" : ""}`}
                    onClick={() => toggleModule(mod.id)}
                    style={active ? { borderColor: mod.color + "66", background: mod.color + "12" } : {}}
                  >
                    <Icon style={{ color: active ? mod.color : "#64748b", fontSize: 16 }} />
                    <div className="ss-module-text">
                      <span className="ss-module-title">{mod.title}</span>
                      <span className="ss-module-desc">{mod.desc}</span>
                    </div>
                    <div className={`ss-module-check ${active ? "ss-module-checked" : ""}`} style={active ? { background: mod.color } : {}}>
                      {active && <FaCheckCircle />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Start Button */}
          <motion.button
            className="ss-btn-start"
            onClick={handleStartScan}
            disabled={!repoPreview || scanning || selectedModules.length === 0}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {scanning ? (
              <><FaSpinner className="ss-spin" /> Starting Scan...</>
            ) : (
              <><FaPlay /> Start Security Scan</>
            )}
          </motion.button>
        </motion.div>

        {/* Right: Recent Scans */}
        <motion.div
          className="ss-right"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="ss-card ss-recent">
            <h3 className="ss-card-title"><FaClock /> Recent Scans</h3>
            {recentScans.length > 0 ? (
              <div className="ss-recent-list">
                {recentScans.slice(0, 8).map((scan, i) => (
                  <div
                    key={scan.id || i}
                    className="ss-recent-item"
                    onClick={() => scan.status === "completed" && navigate(`/scanner/results/${scan.id}`)}
                  >
                    <div className="ss-recent-info">
                      <span className="ss-recent-repo">{scan.repository || scan.repo_url}</span>
                      <span className="ss-recent-time">{scan.completed_at || scan.created_at}</span>
                    </div>
                    <div className="ss-recent-meta">
                      <span className={`ss-status-badge ss-status-${scan.status}`}>
                        {scan.status}
                      </span>
                      {scan.score != null && (
                        <span className="ss-recent-score">{scan.score}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ss-recent-empty">
                <FaShieldAlt />
                <p>No scans yet. Enter a repository URL to get started.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
