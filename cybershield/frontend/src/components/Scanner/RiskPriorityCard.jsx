const RISK_STYLES = {
  Immediate: { bg: "rgba(239, 68, 68, 0.15)", border: "#ef4444", text: "#ef4444", label: "IMMEDIATE", desc: "Exploitable now with critical impact" },
  Critical: { bg: "rgba(239, 68, 68, 0.15)", border: "#ef4444", text: "#ef4444", label: "CRITICAL", desc: "Requires urgent attention" },
  High: { bg: "rgba(249, 115, 22, 0.15)", border: "#f97316", text: "#f97316", label: "HIGH", desc: "Easily exploitable" },
  Medium: { bg: "rgba(234, 179, 8, 0.15)", border: "#eab308", text: "#eab308", label: "MEDIUM", desc: "Requires specific conditions" },
  Low: { bg: "rgba(34, 197, 94, 0.15)", border: "#22c55e", text: "#22c55e", label: "LOW", desc: "Limited impact" },
};

export default function RiskPriorityCard({ priority }) {
  const style = RISK_STYLES[priority] || RISK_STYLES.Medium;

  return (
    <div className="ai-risk-priority" style={{ background: style.bg, borderColor: style.border }}>
      <div className="ai-risk-indicator" style={{ background: style.text }} />
      <div className="ai-risk-info">
        <span className="ai-risk-label" style={{ color: style.text }}>
          {style.label}
        </span>
        <span className="ai-risk-desc">{style.desc}</span>
      </div>
    </div>
  );
}
