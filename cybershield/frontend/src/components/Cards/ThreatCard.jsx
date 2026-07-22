export default function ThreatCard({ title, count, severity }) {
  const severityColors = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
  };

  const color = severityColors[severity?.toLowerCase()] || "#64748b";

  return (
    <div className="threat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="threat-header">
        <h4>{title}</h4>
        <span className="threat-count">{count}</span>
      </div>
      <div className="threat-severity" style={{ color }}>
        {severity}
      </div>
    </div>
  );
}