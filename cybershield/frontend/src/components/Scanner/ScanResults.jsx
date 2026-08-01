import { useState } from "react";
import VulnerabilityCard from "./VulnerabilityCard";
import AIExplanationPanel from "./AIExplanationPanel";
import { explainFinding } from "../../api/vulnerabilityAiApi";

/**
 * ScanResults — Module D4
 *
 * Displays scan vulnerability findings with AI explanation capability.
 * Groups findings by file, allows clicking "Explain with AI" on any finding.
 */
export default function ScanResults({ results }) {
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [explainingId, setExplainingId] = useState(null);

  if (!results || !results.vulnerabilities || results.vulnerabilities.length === 0) {
    return null;
  }

  const { vulnerabilities, risk_score, report } = results;

  // Group vulnerabilities by file
  const byFile = {};
  for (const vuln of vulnerabilities) {
    const file = vuln.file || "Unknown";
    if (!byFile[file]) byFile[file] = [];
    byFile[file].push(vuln);
  }

  const handleExplain = async (finding) => {
    const findingId = `${finding.file || "unknown"}-${finding.type}-${Date.now()}`;
    setExplainingId(findingId);
    setSelectedAnalysis(null);

    try {
      const result = await explainFinding({
        type: finding.type,
        severity: finding.severity,
        file: finding.file || "Unknown",
        code: finding.code || "",
        finding_id: findingId,
      });
      setSelectedAnalysis(result.analysis);
    } catch (err) {
      console.error("AI explanation failed:", err);
      setSelectedAnalysis({
        summary: "Failed to generate AI explanation. Please try again.",
        technical_explanation: err.response?.data?.detail || err.message,
        attack_scenario: "",
        owasp: "",
        cwe: "",
        cvss_reason: "",
        risk_priority: "Medium",
        remediation: [],
        secure_code: "",
        prevention: [],
        learning_resources: [],
      });
    } finally {
      setExplainingId(null);
    }
  };

  // Count by severity
  const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  vulnerabilities.forEach((v) => {
    const s = v.severity || "Medium";
    severityCounts[s] = (severityCounts[s] || 0) + 1;
  });

  return (
    <div className="scan-results-section">
      {/* Results Header */}
      <div className="scan-results-header">
        <div className="scan-results-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <h2>Scan Results</h2>
          <span className="scan-results-count">{vulnerabilities.length} findings</span>
        </div>
        <div className="scan-results-severity-bar">
          {severityCounts.Critical > 0 && (
            <span className="sev-pill sev-critical">🔴 {severityCounts.Critical} Critical</span>
          )}
          {severityCounts.High > 0 && (
            <span className="sev-pill sev-high">🟠 {severityCounts.High} High</span>
          )}
          {severityCounts.Medium > 0 && (
            <span className="sev-pill sev-medium">🟡 {severityCounts.Medium} Medium</span>
          )}
          {severityCounts.Low > 0 && (
            <span className="sev-pill sev-low">🟢 {severityCounts.Low} Low</span>
          )}
        </div>
      </div>

      {/* Risk Score */}
      {risk_score !== undefined && (
        <div className="scan-results-risk">
          <span className="risk-label">Risk Score</span>
          <span className={`risk-value risk-${risk_score >= 70 ? "high" : risk_score >= 40 ? "medium" : "low"}`}>
            {risk_score}
          </span>
        </div>
      )}

      {/* Executive Summary */}
      {report?.ai_report?.summary && (
        <div className="scan-results-summary widget-card">
          <h3 className="ai-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Executive Summary
          </h3>
          <p>{report.ai_report.summary}</p>
        </div>
      )}

      {/* Vulnerability Cards by File */}
      <div className="scan-results-grid">
        {Object.entries(byFile).map(([file, fileVulns]) => (
          <div key={file} className="scan-results-file-group">
            <div className="scan-results-file-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span>{file}</span>
            </div>
            {fileVulns.map((vuln, i) => (
              <VulnerabilityCard
                key={`${file}-${i}`}
                finding={{ ...vuln, file }}
                onExplain={handleExplain}
                isExplaining={explainingId === `${file}-${vuln.type}-${vuln.file}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* AI Explanation Panel (Modal) */}
      {selectedAnalysis && (
        <AIExplanationPanel
          analysis={selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
        />
      )}
    </div>
  );
}
