export default function ChecklistProgress({ score, completed, total }) {
  const pct = Math.round(score) || 0;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const color = pct >= 80 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444";
  const glowColor = pct >= 80 ? "rgba(16,185,129,0.25)" : pct >= 50 ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)";

  return (
    <div style={{
      background: "var(--glass-bg, rgba(17,24,39,0.70))",
      backdropFilter: "blur(12px)",
      border: "1px solid var(--glass-border, rgba(255,255,255,0.10))",
      borderRadius: 16, padding: 24,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
    }}>
      {/* Gauge */}
      <div style={{ position: "relative", width: 150, height: 150 }}>
        <svg width="150" height="150" viewBox="0 0 150 150">
          {/* Background track */}
          <circle
            cx="75" cy="75" r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14"
          />
          {/* Glow filter */}
          <defs>
            <filter id="scoreGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Progress arc */}
          <circle
            cx="75" cy="75" r={radius}
            fill="none" stroke={color} strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 75 75)"
            filter="url(#scoreGlow)"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
          {/* Score text */}
          <text x="75" y="70" textAnchor="middle" fontSize="32" fontWeight="800" fill={color}>
            {pct}%
          </text>
          <text x="75" y="92" textAnchor="middle" fontSize="11" fill="#94a3b8" fontWeight="500">
            Security Score
          </text>
        </svg>
        {/* Ambient glow behind gauge */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 120, height: 120, borderRadius: "50%",
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
      </div>

      {/* Stats */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "var(--text-secondary, #cbd5e1)", margin: 0 }}>Completed Tasks</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary, #f8fafc)", margin: "4px 0 0" }}>
          {completed} <span style={{ fontSize: 16, fontWeight: 400, color: "#64748b" }}>/ {total}</span>
        </p>
      </div>
    </div>
  );
}
