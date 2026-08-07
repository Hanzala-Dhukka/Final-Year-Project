import { TrendingDown, ShieldAlert, CheckCircle2 } from "lucide-react";

/**
 * RiskReduction — displays risk reduction metrics:
 * risk reduced, risk remaining, and completed security controls count.
 */
export default function RiskReduction({ riskReduced = 0, riskRemaining = 0, totalRisk = 0, completedControls = 0 }) {
  const reducedPct = totalRisk > 0 ? Math.round((riskReduced / totalRisk) * 100) : 0;

  return (
    <div style={{
      background: "var(--glass-bg, rgba(17,24,39,0.70))",
      backdropFilter: "blur(12px)",
      border: "1px solid var(--glass-border, rgba(255,255,255,0.10))",
      borderRadius: 16, padding: 20,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "rgba(16,185,129,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <TrendingDown size={16} color="#10B981" />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #f8fafc)" }}>
          Risk Reduction
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        width: "100%", height: 8, borderRadius: 4,
        background: "rgba(255,255,255,0.06)", marginBottom: 14, overflow: "hidden",
      }}>
        <div style={{
          width: `${reducedPct}%`, height: "100%", borderRadius: 4,
          background: "linear-gradient(90deg, #10B981 0%, #3B82F6 100%)",
          transition: "width 0.6s ease",
          boxShadow: "0 0 12px rgba(16,185,129,0.3)",
        }} />
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {/* Completed Controls */}
        <div style={{
          textAlign: "center", padding: "12px 8px", borderRadius: 10,
          background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)",
        }}>
          <CheckCircle2 size={16} color="#10B981" style={{ margin: "0 auto 6px" }} />
          <p style={{ fontSize: 20, fontWeight: 700, color: "#10B981", margin: 0 }}>{completedControls}</p>
          <p style={{ fontSize: 10, color: "#64748b", margin: "4px 0 0" }}>Controls Done</p>
        </div>

        {/* Risk Reduced */}
        <div style={{
          textAlign: "center", padding: "12px 8px", borderRadius: 10,
          background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)",
        }}>
          <ShieldAlert size={16} color="#3B82F6" style={{ margin: "0 auto 6px" }} />
          <p style={{ fontSize: 20, fontWeight: 700, color: "#3B82F6", margin: 0 }}>{riskReduced}</p>
          <p style={{ fontSize: 10, color: "#64748b", margin: "4px 0 0" }}>Risk Reduced</p>
        </div>

        {/* Remaining */}
        <div style={{
          textAlign: "center", padding: "12px 8px", borderRadius: 10,
          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)",
        }}>
          <TrendingDown size={16} color="#EF4444" style={{ margin: "0 auto 6px" }} />
          <p style={{ fontSize: 20, fontWeight: 700, color: "#EF4444", margin: 0 }}>{riskRemaining}</p>
          <p style={{ fontSize: 10, color: "#64748b", margin: "4px 0 0" }}>Remaining</p>
        </div>
      </div>
    </div>
  );
}
