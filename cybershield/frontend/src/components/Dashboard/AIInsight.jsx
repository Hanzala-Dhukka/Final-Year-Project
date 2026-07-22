export default function AIInsight({ insight }) {
  return (
    <div className="ai-insight-card">
      <div className="ai-header">
        <span className="ai-icon">🤖</span>
        <h3>AI Security Assistant</h3>
      </div>
      <p className="ai-message">{insight || "Your project has 3 medium risks"}</p>
    </div>
  );
}