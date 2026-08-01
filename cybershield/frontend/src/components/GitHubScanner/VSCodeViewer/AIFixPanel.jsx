import { FaRobot, FaCopy, FaDownload, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import "./AIFixPanel.css";

export default function AIFixPanel({
  aiFix,
  loading
}) {
  if (loading) {
    return (
      <div className="ai-panel">
        <div className="ai-loading">
          <div className="ai-spinner" />
          <span>Generating AI Fix...</span>
        </div>
      </div>
    );
  }

  if (!aiFix) {
    return (
      <div className="ai-panel">
        <div className="ai-empty">
          <FaRobot size={32} style={{ color: "#6366f1", marginBottom: 12 }} />
          <p>Click a vulnerability to get an AI-powered fix</p>
        </div>
      </div>
    );
  }

  const copyFix = () => {
    navigator.clipboard.writeText(aiFix.after);
  };

  const downloadPatch = () => {
    const blob = new Blob([aiFix.patch], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-fix-${aiFix.issue.replace(/\s+/g, "-").toLowerCase()}.patch`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sevColor = {
    critical: "#ff0000",
    high: "#ff6b00",
    medium: "#ffc107",
    low: "#17c964",
  }[(aiFix.severity || "").toLowerCase()] || "#888";

  return (
    <div className="ai-panel">
      <div className="ai-header">
        <FaRobot />
        <span>AI Security Assistant</span>
      </div>

      {/* Issue + Severity */}
      <div className="ai-section">
        <div className="ai-issue-row">
          <span className="ai-issue-name">{aiFix.issue}</span>
          <span
            className="ai-severity-badge"
            style={{ background: sevColor + "22", color: sevColor, borderColor: sevColor + "44" }}
          >
            {aiFix.severity}
          </span>
        </div>
      </div>

      {/* Why Dangerous */}
      <div className="ai-section">
        <h4>
          <FaExclamationTriangle style={{ color: "#ffc107" }} />
          Why is this dangerous?
        </h4>
        <p>{aiFix.why}</p>
      </div>

      {/* Before / After */}
      <div className="ai-section">
        <h4>Suggested Fix</h4>
        <div className="ai-diff">
          <div className="ai-diff-block ai-diff-before">
            <div className="ai-diff-label diff-label-before">Before</div>
            <pre><code>{aiFix.before}</code></pre>
          </div>
          <div className="ai-diff-block ai-diff-after">
            <div className="ai-diff-label diff-label-after">After</div>
            <pre><code>{aiFix.after}</code></pre>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="ai-section">
        <h4>
          <FaCheckCircle style={{ color: "#17c964" }} />
          Recommendation
        </h4>
        <p>{aiFix.recommendation}</p>
      </div>

      {/* Confidence */}
      <div className="ai-confidence">
        Confidence: {aiFix.confidence}
      </div>

      {/* Action Buttons */}
      <div className="ai-buttons">
        <button className="ai-btn ai-btn-copy" onClick={copyFix}>
          <FaCopy /> Copy Fix
        </button>
        <button className="ai-btn ai-btn-export" onClick={downloadPatch}>
          <FaDownload /> Export Patch
        </button>
      </div>
    </div>
  );
}