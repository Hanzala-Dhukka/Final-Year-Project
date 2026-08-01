import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaGithub,
  FaStar,
  FaCodeBranch,
  FaDownload,
  FaCopy,
  FaExternalLinkAlt,
  FaUsers,
  FaShieldAlt,
  FaPlay,
  FaExchangeAlt,
  FaFileAlt,
  FaCheck,
} from "react-icons/fa";
import { FiGitBranch, FiClock, FiHardDrive, FiAlertCircle } from "react-icons/fi";
import "./RepositoryHeader.css";

function formatSize(kb) {
  if (kb == null) return "--";
  if (kb >= 1048576) return `${(kb / 1048576).toFixed(1)} GB`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function timeAgo(dateStr) {
  if (!dateStr) return "--";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function RepositoryHeader({
  repository,
  securityScore = 86,
  onStartScan,
  onGenerateReport,
  onCompare,
}) {
  const [copied, setCopied] = useState(false);

  if (!repository) return null;

  const fullName = repository.repository || repository.full_name || "unknown/repo";
  const description = repository.description || "";
  const language = repository.language || "--";
  const stars = repository.stars ?? "--";
  const forks = repository.forks ?? "--";
  const branch = repository.default_branch || "main";
  const lastCommit = repository.last_commit || repository.updated_at || "";
  const sizeKB = repository.size != null ? repository.size * 1024 : null;
  const contributors = repository.contributors ?? "--";
  const visibility = repository.visibility || "public";
  const openIssues = repository.open_issues ?? "--";
  const owner = repository.owner || fullName.split("/")[0];
  const repoName = fullName.split("/").pop() || fullName;

  const htmlUrl = `https://github.com/${fullName}`;
  const cloneUrl = `https://github.com/${fullName}.git`;
  const zipUrl = `${htmlUrl}/archive/refs/heads/${branch}.zip`;

  const handleCopyClone = async () => {
    try {
      await navigator.clipboard.writeText(cloneUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const scoreColor =
    securityScore >= 80 ? "#22c55e" : securityScore >= 60 ? "#eab308" : "#ef4444";

  return (
    <motion.div
      className="repo-header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ── Main Header ─────────────────────────────────── */}
      <div className="rh-main">
        <div className="rh-left">
          <div className="rh-icon">
            <FaGithub />
          </div>
          <div className="rh-info">
            <h1 className="rh-name">{fullName}</h1>
            {description && <p className="rh-desc">{description}</p>}
            <div className="rh-badges">
              {language && language !== "--" && (
                <span className="rh-badge rh-badge-lang">{language}</span>
              )}
              <span className="rh-badge rh-badge-vis">
                {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
              </span>
              <span className="rh-badge rh-badge-license">No License</span>
            </div>
          </div>
        </div>

        <div className="rh-right">
          {onStartScan && (
            <button className="rh-btn rh-btn-primary" onClick={onStartScan}>
              <FaPlay /> Start Scan
            </button>
          )}
          {onGenerateReport && (
            <button className="rh-btn rh-btn-secondary" onClick={onGenerateReport}>
              <FaFileAlt /> Generate Report
            </button>
          )}
          {onCompare && (
            <button className="rh-btn rh-btn-secondary" onClick={onCompare}>
              <FaExchangeAlt /> Compare
            </button>
          )}
        </div>
      </div>

      {/* ── Metadata Grid ───────────────────────────────── */}
      <div className="rh-meta-grid">
        <div className="rh-meta-card">
          <FaStar className="rh-meta-icon rh-meta-star" />
          <div>
            <h4>Stars</h4>
            <p>{typeof stars === "number" ? stars.toLocaleString() : stars}</p>
          </div>
        </div>
        <div className="rh-meta-card">
          <FaCodeBranch className="rh-meta-icon rh-meta-fork" />
          <div>
            <h4>Forks</h4>
            <p>{typeof forks === "number" ? forks.toLocaleString() : forks}</p>
          </div>
        </div>
        <div className="rh-meta-card">
          <FiGitBranch className="rh-meta-icon rh-meta-branch" />
          <div>
            <h4>Default Branch</h4>
            <p>{branch}</p>
          </div>
        </div>
        <div className="rh-meta-card">
          <FiClock className="rh-meta-icon rh-meta-time" />
          <div>
            <h4>Last Updated</h4>
            <p>{lastCommit ? new Date(lastCommit).toLocaleDateString() : "--"}</p>
          </div>
        </div>
        <div className="rh-meta-card">
          <FiHardDrive className="rh-meta-icon rh-meta-size" />
          <div>
            <h4>Size</h4>
            <p>{formatSize(sizeKB)}</p>
          </div>
        </div>
        <div className="rh-meta-card">
          <FaUsers className="rh-meta-icon rh-meta-users" />
          <div>
            <h4>Contributors</h4>
            <p>{contributors}</p>
          </div>
        </div>
      </div>

      {/* ── Actions + Score Row ─────────────────────────── */}
      <div className="rh-bottom-row">
        <div className="rh-actions">
          <a href={htmlUrl} target="_blank" rel="noreferrer" className="rh-action-link">
            <FaExternalLinkAlt /> Open GitHub
          </a>
          <button className="rh-action-btn" onClick={handleCopyClone}>
            {copied ? <FaCheck className="rh-copy-check" /> : <FaCopy />}
            {copied ? "Copied!" : "Copy Clone URL"}
          </button>
          <a href={zipUrl} className="rh-action-link" download>
            <FaDownload /> Download ZIP
          </a>
        </div>

        <div className="rh-score-card">
          <div className="rh-score-ring" style={{ borderColor: scoreColor }}>
            <span className="rh-score-value" style={{ color: scoreColor }}>
              {securityScore}
            </span>
          </div>
          <div className="rh-score-info">
            <h3>
              <FaShieldAlt /> Security Score
            </h3>
            <p>
              {securityScore >= 80
                ? "Good"
                : securityScore >= 60
                ? "Moderate"
                : "Needs Attention"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
