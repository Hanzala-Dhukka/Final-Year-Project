import { useState } from "react"
import { motion } from "framer-motion"
import { FaGithub, FaSearch, FaSync, FaTimes, FaHistory } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import API from "../../api/api"

export default function BeforeScan({ onStartScan }) {
  const [repoUrl, setRepoUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [validated, setValidated] = useState(null)
  const navigate = useNavigate()

  const handleValidate = async () => {
    if (!repoUrl.trim()) return
    try {
      setLoading(true)
      const res = await API.post("/github/validate", { repository: repoUrl })
      setValidated(res.data)
    } catch (err) {
      const msg = err.response?.data?.detail || "Validation failed. Check the URL."
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleStartScan = () => {
    onStartScan(repoUrl)
  }

  return (
    <div className="gs-page">
      <div className="gs-empty-state">
        <FaGithub className="gs-empty-icon" />
        <h2>GitHub Repository Scanner</h2>
        <p>Paste a GitHub repository URL to start a security scan.</p>
        <button
          className="gs-btn-outline gs-history-btn"
          onClick={() => navigate("/github-scan-history")}
        >
          <FaHistory /> View Scan History
        </button>
      </div>

      {/* URL Input */}
      <div className="gs-url-bar">
        <div className="gs-url-input-wrap">
          <FaGithub className="gs-url-icon" />
          <input
            type="text"
            placeholder="https://github.com/owner/repository"
            value={repoUrl}
            onChange={(e) => {
              setRepoUrl(e.target.value)
              setValidated(null)
            }}
            onKeyDown={(e) => e.key === "Enter" && handleValidate()}
            className="gs-url-input"
          />
          {repoUrl && (
            <button
              className="gs-url-clear"
              onClick={() => {
                setRepoUrl("")
                setValidated(null)
              }}
            >
              <FaTimes />
            </button>
          )}
        </div>
        <button
          className="gs-btn-primary"
          onClick={handleValidate}
          disabled={loading || !repoUrl.trim()}
        >
          {loading ? (
            <><FaSync className="gs-spin" /> Validating...</>
          ) : (
            <><FaSearch /> Validate</>
          )}
        </button>
      </div>

      {/* Validated Preview */}
      {validated && (
        <motion.div
          className="gs-preview-card"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="gs-preview-info">
            <FaGithub style={{ fontSize: 28, color: "var(--textSecondary)" }} />
            <div>
              <p className="gs-preview-name">
                {validated.repository || repoUrl}
              </p>
            </div>
          </div>
          <button
            className="gs-btn-primary gs-btn-lg"
            onClick={handleStartScan}
            disabled={loading}
          >
            <FaSearch /> Start Scan
          </button>
        </motion.div>
      )}
    </div>
  )
}
