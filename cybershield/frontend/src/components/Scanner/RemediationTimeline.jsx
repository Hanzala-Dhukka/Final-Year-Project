export default function RemediationTimeline({ steps }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="ai-section">
      <h3 className="ai-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Remediation Steps
      </h3>
      <div className="ai-remediation-timeline">
        {steps.map((step, i) => (
          <div key={i} className="ai-remediation-step">
            <div className="ai-remediation-left">
              <div className="ai-remediation-node">
                <span className="ai-remediation-number">{i + 1}</span>
              </div>
              {i < steps.length - 1 && <div className="ai-remediation-connector" />}
            </div>
            <div className="ai-remediation-content">
              <p>{step.replace(/^Step\s*\d+[:\.\)]\s*/i, "")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
