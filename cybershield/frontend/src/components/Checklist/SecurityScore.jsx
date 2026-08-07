import { ShieldCheck, TrendingUp } from "lucide-react";

const levelColors = {
  Excellent: { color: "#10B981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  Good:      { color: "#3B82F6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.25)" },
  Moderate:  { color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)" },
  Critical:  { color: "#EF4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.25)" },
};

/**
 * SecurityScore — displays the risk-weighted security score gauge
 * with level badge and completion stats.
 */
export default function SecurityScore({ score = 0, level = "Critical", completedTasks = 0, totalTasks = 0 }) {
  const pct = Math.round(score) || 0;
  const lvl = levelColors[level] || levelColors.Critical;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div style={{
      background: "var(--glass-bg, rgba(17,24,39,0.70))",
      backdropFilter: "blur(12px)",
      border: "1px solid var(--glass-border, rgba(255,255,255,0.10))",
      borderRadius: 16, padding: 24,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ShieldCheck size={18} color="#60A5FA" />
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #f8fafc)" }}>
          Security Score
        </span>
      </div>

      {/* Gauge */}
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
          <defs>
            <filter id="postureGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx="70" cy="70" r={radius}
            fill="none" stroke={lvl.color} strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
            filter="url(#postureGlow)"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
          <text x="70" y="65" textAnchor="middle" fontSize="30" fontWeight="800" fill={lvl.color}>
            {pct}%
          </text>
          <text x="70" y="85" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="500">
            Risk-Weighted
          </text>
        </svg>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 100, height: 100, borderRadius: "50%",
          background: `radial-gradient(circle, ${lvl.color}20 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
      </div>

      {/* Level badge */}
      <span style={{
        fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
        padding: "5px 14px", borderRadius: 8,
        color: lvl.color, backgroundColor: lvl.bg,
        border: `1px solid ${lvl.border}`,
      }}>
        {level}
      </span>

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%",
      }}>
        <div style={{
          textAlign: "center", padding: "10px 8px", borderRadius: 10,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#10B981", margin: 0 }}>{completedTasks}</p>
          <p style={{ fontSize: 10, color: "#64748b", margin: "2px 0 0" }}>Completed</p>
        </div>
        <div style={{
          textAlign: "center", padding: "10px 8px", borderRadius: 10,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#94a3b8", margin: 0 }}>{totalTasks}</p>
          <p style={{ fontSize: 10, color: "#64748b", margin: "2px 0 0" }}>Total Tasks</p>
        </div>
      </div>
    </div>
  );
}
