import SecureCodeExample from "./SecureCodeExample";
import RemediationTimeline from "./RemediationTimeline";
import RiskPriorityCard from "./RiskPriorityCard";

export default function AIExplanationPanel({ analysis, onClose }) {
  if (!analysis) return null;

  return (
    <div className="ai-panel-overlay" onClick={onClose}>
      <div className="ai-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-panel-header">
          <div className="ai-panel-title">
            <div className="ai-panel-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <div>
              <h2>AI Vulnerability Analysis</h2>
              <p className="ai-panel-subtitle">Powered by Groq AI</p>
            </div>
          </div>
          <button className="ai-panel-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="ai-panel-body">
          {/* Risk Priority + OWASP/CWE Row */}
          <div className="ai-panel-top-row">
            <RiskPriorityCard priority={analysis.risk_priority} />
            <div className="ai-panel-tags">
              {analysis.owasp && (
                <a
                  href={`https://owasp.org/Top10/${analysis.owasp.split(" ")[0].replace(":", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ai-tag ai-tag-owasp"
                >
                  <span className="ai-tag-label">OWASP</span>
                  {analysis.owasp}
                </a>
              )}
              {analysis.cwe && (
                <a
                  href={`https://cwe.mitre.org/data/definitions/${analysis.cwe.replace("CWE-", "")}.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ai-tag ai-tag-cwe"
                >
                  <span className="ai-tag-label">CWE</span>
                  {analysis.cwe}
                </a>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="ai-section">
            <h3 className="ai-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Summary
            </h3>
            <p className="ai-section-text">{analysis.summary}</p>
          </div>

          {/* Technical Explanation */}
          <div className="ai-section">
            <h3 className="ai-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              Technical Explanation
            </h3>
            <p className="ai-section-text">{analysis.technical_explanation}</p>
          </div>

          {/* Attack Scenario */}
          <div className="ai-section">
            <h3 className="ai-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Attack Scenario
            </h3>
            <div className="ai-attack-box">
              {analysis.attack_scenario.split("\n").map((line, i) => (
                <div key={i} className="ai-attack-step">
                  <span className="ai-attack-bullet">{i + 1}</span>
                  <span>{line.replace(/^\d+[\.\)]\s*/, "")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CVSS Explanation */}
          {analysis.cvss_reason && (
            <div className="ai-section">
              <h3 className="ai-section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                CVSS Score Explanation
              </h3>
              <p className="ai-section-text">{analysis.cvss_reason}</p>
            </div>
          )}

          {/* Remediation Timeline */}
          <RemediationTimeline steps={analysis.remediation || []} />

          {/* Secure Code Example */}
          {analysis.secure_code && (
            <SecureCodeExample code={analysis.secure_code} />
          )}

          {/* Prevention */}
          {analysis.prevention && analysis.prevention.length > 0 && (
            <div className="ai-section">
              <h3 className="ai-section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                Prevention Checklist
              </h3>
              <div className="ai-prevention-list">
                {analysis.prevention.map((item, i) => (
                  <div key={i} className="ai-prevention-item">
                    <span className="ai-check-icon">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Resources */}
          {analysis.learning_resources && analysis.learning_resources.length > 0 && (
            <div className="ai-section">
              <h3 className="ai-section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                Recommended Learning
              </h3>
              <div className="ai-learning-list">
                {analysis.learning_resources.map((resource, i) => (
                  <div key={i} className="ai-learning-item">
                    <span className="ai-learn-icon">✓</span>
                    <span>{resource}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
