import { CheckCircle2, Circle, Radar } from "lucide-react";
import colors from "../../styles/colors";

const severityConfig = {
  Critical: { color: colors.critical, bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.25)" },
  High:     { color: colors.high,     bg: "rgba(234,88,12,0.12)",  border: "rgba(234,88,12,0.25)" },
  Medium:   { color: colors.medium,   bg: "rgba(217,119,6,0.12)",  border: "rgba(217,119,6,0.25)" },
  Low:      { color: colors.low,      bg: "rgba(22,163,74,0.12)",  border: "rgba(22,163,74,0.25)" },
};

const statusConfig = {
  pending:     { label: "Pending",     color: "#94a3b8", bg: "rgba(148,163,184,0.10)" },
  in_progress: { label: "In Progress", color: "#60A5FA", bg: "rgba(96,165,250,0.10)" },
  completed:   { label: "Completed",   color: "#34D399", bg: "rgba(52,211,153,0.10)" },
};

export default function ChecklistCard({ item, onToggle }) {
  const done = item.status === "completed";
  const sev = severityConfig[item.severity] || severityConfig.Medium;
  const stat = statusConfig[item.status] || statusConfig.pending;

  return (
    <div style={{
      background: done
        ? "rgba(17,24,39,0.40)"
        : "var(--glass-bg, rgba(17,24,39,0.70))",
      backdropFilter: "blur(12px)",
      border: `1px solid ${done ? "rgba(255,255,255,0.04)" : "var(--glass-border, rgba(255,255,255,0.10))"}`,
      borderLeft: `3px solid ${sev.color}`,
      borderRadius: 12, padding: "16px 18px",
      transition: "all 0.2s ease",
      opacity: done ? 0.65 : 1,
    }}>
      {/* Top row: severity + category + scan badge + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
            padding: "3px 8px", borderRadius: 6,
            color: sev.color, backgroundColor: sev.bg,
            border: `1px solid ${sev.border}`,
          }}>
            {item.severity}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 500, color: "#94a3b8",
            padding: "3px 8px", borderRadius: 6,
            background: "rgba(255,255,255,0.04)",
          }}>
            {item.category}
          </span>
          {item.recommended && (
            <span style={{
              fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
              padding: "3px 7px", borderRadius: 5,
              color: "#60A5FA", background: "rgba(96,165,250,0.10)",
              border: "1px solid rgba(96,165,250,0.20)",
              display: "flex", alignItems: "center", gap: 3,
            }}>
              <Radar size={9} />
              SCAN
            </span>
          )}
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600,
          padding: "3px 8px", borderRadius: 6,
          color: stat.color, backgroundColor: stat.bg,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          {done ? <CheckCircle2 size={12} /> : <Circle size={12} />}
          {stat.label}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: 14, fontWeight: 600, margin: "0 0 6px",
        color: done ? "#64748b" : "var(--text-primary, #f8fafc)",
        textDecoration: done ? "line-through" : "none",
        lineHeight: 1.4,
      }}>
        {item.title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: 13, color: done ? "#475569" : "var(--text-secondary, #cbd5e1)",
        margin: "0 0 10px", lineHeight: 1.5,
      }}>
        {item.description}
      </p>

      {/* Frameworks */}
      {item.frameworks?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
          {item.frameworks.map((fw) => (
            <span key={fw} style={{
              fontSize: 10, fontWeight: 500,
              padding: "2px 7px", borderRadius: 4,
              color: "#94a3b8", background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              {fw}
            </span>
          ))}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => onToggle(item)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 8,
          border: "none", fontSize: 12, fontWeight: 600,
          color: "#fff", cursor: "pointer",
          background: done
            ? "rgba(100,116,139,0.25)"
            : "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
          boxShadow: done ? "none" : "0 2px 10px rgba(37,99,235,0.3)",
          transition: "all 0.2s ease",
          width: "100%", justifyContent: "center",
        }}
      >
        {done ? (
          <>
            <Circle size={14} />
            Mark Incomplete
          </>
        ) : (
          <>
            <CheckCircle2 size={14} />
            Mark Complete
          </>
        )}
      </button>
    </div>
  );
}
