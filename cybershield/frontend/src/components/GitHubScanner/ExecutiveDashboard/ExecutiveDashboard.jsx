import { motion } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import {
  FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaFileAlt,
  FaCode, FaServer, FaBox, FaRobot, FaDownload, FaSync,
  FaBug, FaGlobe, FaLock, FaStar, FaCodeBranch, FaHashtag,
  FaEye, FaDatabase, FaNetworkWired, FaPlay, FaCubes,
} from "react-icons/fa";
import "./ExecutiveDashboard.css";

/* ── Helpers ────────────────────────────────────────────────── */
function getGrade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function getGradeColor(score) {
  if (score >= 90) return "#22c55e";
  if (score >= 80) return "#84cc16";
  if (score >= 70) return "#eab308";
  if (score >= 60) return "#f97316";
  return "#ef4444";
}

function getSeverityColor(sev) {
  return { Critical: "#ef4444", High: "#f97316", Medium: "#eab308", Low: "#22c55e" }[sev] || "#64748b";
}

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function ExecutiveDashboard({
  repository = {},
  summary = {},
  findings = [],
  dependency = {},
  aiReport = {},
  technologies = {},
  fileReport = [],
  onNavigate,
}) {
  /* ── Derived data ─────────────────────────────────────────── */
  const highCount = findings.filter((f) => f.severity === "High").length;
  const mediumCount = findings.filter((f) => f.severity === "Medium").length;
  const lowCount = findings.filter((f) => f.severity === "Low").length;
  const criticalCount = findings.filter((f) => f.severity === "Critical").length;

  const score = Math.max(0, 100 - highCount * 10 - mediumCount * 5 - criticalCount * 25 - lowCount * 2);
  const grade = getGrade(score);
  const gradeColor = getGradeColor(score);

  const severityCounts = summary.severity || { Critical: criticalCount, High: highCount, Medium: mediumCount, Low: lowCount };

  const scanModules = [
    { name: "Secret Scan", done: findings.some((f) => (f.type || "").toLowerCase().includes("secret") || (f.type || "").toLowerCase().includes("key") || (f.type || "").toLowerCase().includes("token")) },
    { name: "Dependency Scan", done: (dependency.totalPackages || 0) > 0 },
    { name: "OWASP", done: findings.length > 0 },
    { name: "AI Analysis", done: !!(aiReport && aiReport.summary) },
    { name: "Git History", done: !!(repository.lastCommit) },
    { name: "Code Quality", done: fileReport.length > 0 },
  ];

  const topVulns = findings.slice(0, 5);

  const depSafe = Math.max(0, (dependency.totalPackages || 0) - (dependency.outdated || 0) - (dependency.risky || 0));
  const depPct = dependency.totalPackages ? Math.round((depSafe / dependency.totalPackages) * 100) : 0;
  const owaspPct = findings.length > 0 ? Math.max(20, 100 - findings.length * 5) : 100;
  const secretsPct = severityCounts.High > 0 ? Math.max(30, 100 - severityCounts.High * 15) : 100;
  const codeQualityPct = fileReport.length > 0 ? Math.max(20, 100 - fileReport.length * 8) : 100;

  return (
    <motion.div className="exec-dashboard" variants={stagger} initial="hidden" animate="visible">
      {/* ── Repository Header ──────────────────────────────── */}
      <motion.div className="exec-repo-header" variants={fadeUp}>
        <div className="exec-repo-left">
          <div className="exec-repo-icon"><FaCode /></div>
          <div>
            <h1 className="exec-repo-name">{repository.name || "Repository"}</h1>
            {repository.description && <p className="exec-repo-desc">{repository.description}</p>}
          </div>
        </div>
        <div className="exec-grade" style={{ borderColor: gradeColor }}>
          <span className="exec-grade-label">Security Grade</span>
          <span className="exec-grade-value" style={{ color: gradeColor }}>{grade}</span>
        </div>
      </motion.div>

      {/* ── KPI Cards ──────────────────────────────────────── */}
      <motion.div className="exec-kpi-grid" variants={fadeUp}>
        {[
          { label: "Security Score", value: score, icon: <FaShieldAlt />, color: gradeColor },
          { label: "Risk Level", value: summary.riskLevel || "—", icon: <FaExclamationTriangle />, color: summary.riskLevel === "High" ? "#ef4444" : "#f59e0b" },
          { label: "Files with Issues", value: summary.filesWithIssues ?? fileReport.length, icon: <FaFileAlt />, color: "#f97316" },
          { label: "Packages", value: dependency.totalPackages ?? 0, icon: <FaBox />, color: "#06b6d4" },
          { label: "Risky Packages", value: dependency.risky ?? 0, icon: <FaLock />, color: "#ef4444" },
          { label: "Visibility", value: repository.visibility ? repository.visibility.charAt(0).toUpperCase() + repository.visibility.slice(1) : "—", icon: <FaGlobe />, color: "#8b5cf6" },
        ].map((kpi) => (
          <div key={kpi.label} className="exec-kpi" style={{ "--kpi-color": kpi.color }}>
            <div className="exec-kpi-icon">{kpi.icon}</div>
            <div className="exec-kpi-value">{kpi.value}</div>
            <div className="exec-kpi-label">{kpi.label}</div>
          </div>
        ))}
      </motion.div>

      {/* ── Severity Cards ─────────────────────────────────── */}
      <motion.div className="exec-severity-row" variants={fadeUp}>
        {[
          { label: "Critical", count: severityCounts.Critical || 0, color: "#ef4444" },
          { label: "High", count: severityCounts.High || 0, color: "#f97316" },
          { label: "Medium", count: severityCounts.Medium || 0, color: "#eab308" },
          { label: "Low", count: severityCounts.Low || 0, color: "#22c55e" },
        ].map((s) => (
          <div key={s.label} className="exec-sev-card" style={{ "--sev-color": s.color }}>
            <div className="exec-sev-dot" />
            <span className="exec-sev-label">{s.label}</span>
            <span className="exec-sev-count">{s.count}</span>
          </div>
        ))}
      </motion.div>

      {/* ── Gauge + Repository Info ────────────────────────── */}
      <motion.div className="exec-two-col" variants={fadeUp}>
        <div className="exec-card exec-gauge-card">
          <h3><FaShieldAlt /> Security Score</h3>
          <div className="exec-gauge-wrap">
            <CircularProgressbar
              value={score}
              text={`${score}%`}
              styles={buildStyles({
                textSize: "22px",
                pathColor: gradeColor,
                textColor: "#fff",
                trailColor: "#1e293b",
              })}
            />
          </div>
          <p className="exec-gauge-label">Overall Security Posture</p>
        </div>

        <div className="exec-card exec-info-card">
          <h3><FaServer /> Repository Summary</h3>
          <div className="exec-info-grid">
            {[
              { label: "Repository", value: repository.name || "—" },
              { label: "Language", value: repository.language || "—" },
              { label: "Backend", value: technologies.backend?.join(", ") || "—" },
              { label: "Database", value: technologies.database?.join(", ") || "—" },
              { label: "Default Branch", value: repository.defaultBranch || "—" },
              { label: "Stars", value: (repository.stars || 0).toLocaleString() },
            ].map((item) => (
              <div key={item.label} className="exec-info-row">
                <span className="exec-info-label">{item.label}</span>
                <span className="exec-info-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── AI Summary + Recommendations ───────────────────── */}
      <motion.div className="exec-two-col" variants={fadeUp}>
        {aiReport?.summary && (
          <div className="exec-card exec-ai-card">
            <h3><FaRobot /> AI Security Summary</h3>
            <p className="exec-ai-text">{aiReport.summary}</p>
          </div>
        )}
        {aiReport?.recommendations?.length > 0 && (
          <div className="exec-card exec-rec-card">
            <h3><FaCheckCircle /> Recommendations</h3>
            <ul className="exec-rec-list">
              {aiReport.recommendations.slice(0, 6).map((rec, i) => (
                <li key={i}>
                  <FaCheckCircle style={{ color: "#22c55e", flexShrink: 0 }} />
                  <span>{typeof rec === "string" ? rec : rec.text || JSON.stringify(rec)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>

      {/* ── Scan Modules ───────────────────────────────────── */}
      <motion.div className="exec-card" variants={fadeUp}>
        <h3><FaCubes /> Security Modules</h3>
        <div className="exec-modules-grid">
          {scanModules.map((mod) => (
            <div key={mod.name} className={`exec-module ${mod.done ? "exec-module-done" : ""}`}>
              {mod.done ? <FaCheckCircle className="exec-module-icon done" /> : <FaPlay className="exec-module-icon pending" />}
              <span>{mod.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Top Vulnerabilities ────────────────────────────── */}
      {topVulns.length > 0 && (
        <motion.div className="exec-card" variants={fadeUp}>
          <h3><FaBug /> Top Vulnerabilities</h3>
          <div className="exec-vuln-list">
            {topVulns.map((vuln, i) => (
              <div key={i} className="exec-vuln-card" style={{ "--vuln-sev": getSeverityColor(vuln.severity) }}>
                <div className="exec-vuln-left">
                  <div className="exec-vuln-sev-bar" />
                  <div>
                    <span className="exec-vuln-type">{vuln.type}</span>
                    <span className="exec-vuln-file">{vuln.file}</span>
                  </div>
                </div>
                <span className="exec-vuln-badge" style={{ background: getSeverityColor(vuln.severity) + "22", color: getSeverityColor(vuln.severity) }}>
                  {vuln.severity}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Health Progress Bars ────────────────────────────── */}
      <motion.div className="exec-card" variants={fadeUp}>
        <h3><FaShieldAlt /> Repository Health</h3>
        <div className="exec-progress-list">
          {[
            { label: "Dependency Health", pct: depPct, color: "#06b6d4" },
            { label: "OWASP Compliance", pct: owaspPct, color: "#8b5cf6" },
            { label: "Secrets Security", pct: secretsPct, color: "#22c55e" },
            { label: "Code Quality", pct: codeQualityPct, color: "#f59e0b" },
          ].map((bar) => (
            <div key={bar.label} className="exec-progress-row">
              <div className="exec-progress-header">
                <span>{bar.label}</span>
                <span>{bar.pct}%</span>
              </div>
              <div className="exec-progress-track">
                <motion.div
                  className="exec-progress-fill"
                  style={{ background: bar.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${bar.pct}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Quick Actions ──────────────────────────────────── */}
      <motion.div className="exec-card" variants={fadeUp}>
        <h3><FaPlay /> Quick Actions</h3>
        <div className="exec-actions-grid">
          {[
            { label: "View VS Code Explorer", icon: <FaCode />, color: "#6366f1", tab: "findings" },
            { label: "View AI Workspace", icon: <FaRobot />, color: "#8b5cf6", tab: "ai" },
            { label: "View Reports", icon: <FaFileAlt />, color: "#06b6d4", tab: "reports" },
          ].map((action) => (
            <button
              key={action.label}
              className="exec-action-btn"
              style={{ "--action-color": action.color }}
              onClick={() => onNavigate && onNavigate(action.tab)}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}