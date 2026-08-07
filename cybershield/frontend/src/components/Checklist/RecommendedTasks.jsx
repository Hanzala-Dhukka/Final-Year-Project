import { Radar, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import colors from "../../styles/colors";

const severityConfig = {
  Critical: { color: colors.critical, bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.25)" },
  High:     { color: colors.high,     bg: "rgba(234,88,12,0.12)",  border: "rgba(234,88,12,0.25)" },
  Medium:   { color: colors.medium,   bg: "rgba(217,119,6,0.12)",  border: "rgba(217,119,6,0.25)" },
  Low:      { color: colors.low,      bg: "rgba(22,163,74,0.12)",  border: "rgba(22,163,74,0.25)" },
};

/**
 * RecommendedTasks — displays scanner-recommended checklist items.
 *
 * Shows tasks that were automatically generated from GitHub scan findings
 * via the Rule Mapping Engine (SC2) and Recommendation Service (SC3).
 */
export default function RecommendedTasks({ tasks = [], stats = null, loading = false }) {
  if (loading) {
    return (
      <div style={{
        background: "var(--glass-bg, rgba(17,24,39,0.70))",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--glass-border, rgba(255,255,255,0.10))",
        borderRadius: 16, padding: 24, textAlign: "center",
        color: "var(--text-secondary, #cbd5e1)", fontSize: 13,
      }}>
        Loading recommendations...
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div style={{
        background: "var(--glass-bg, rgba(17,24,39,0.70))",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--glass-border, rgba(255,255,255,0.10))",
        borderRadius: 16, padding: 24, textAlign: "center",
      }}>
        <Radar size={32} color="#475569" style={{ margin: "0 auto 12px" }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #f8fafc)", margin: 0 }}>
          No scanner recommendations yet
        </p>
        <p style={{ fontSize: 12, color: "var(--text-secondary, #cbd5e1)", marginTop: 6 }}>
          Run a GitHub scan to automatically generate security checklist tasks.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--glass-bg, rgba(17,24,39,0.70))",
      backdropFilter: "blur(12px)",
      border: "1px solid var(--glass-border, rgba(255,255,255,0.10))",
      borderRadius: 16, padding: 20,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(245,158,11,0.25)",
          }}>
            <Radar size={18} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #f8fafc)", margin: 0 }}>
              Scanner Recommendations
            </h3>
            <p style={{ fontSize: 11, color: "var(--text-secondary, #cbd5e1)", margin: 0, marginTop: 2 }}>
              Auto-generated from GitHub scan findings
            </p>
          </div>
        </div>

        {/* Stats badge */}
        {stats && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px", borderRadius: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#F59E0B" }}>{stats.pending}</span>
            <span style={{ fontSize: 11, color: "#64748b" }}>pending</span>
            <span style={{ fontSize: 11, color: "#475569" }}>/</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#10B981" }}>{stats.completed}</span>
            <span style={{ fontSize: 11, color: "#64748b" }}>done</span>
          </div>
        )}
      </div>

      {/* Task list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tasks.map((task, idx) => {
          const sev = severityConfig[task.severity] || severityConfig.Medium;
          const isDone = task.status === "completed";

          return (
            <div
              key={task.checklist_rule || idx}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 10,
                background: isDone ? "rgba(17,24,39,0.30)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isDone ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)"}`,
                opacity: isDone ? 0.5 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {/* Status icon */}
              {isDone ? (
                <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
              ) : (
                <AlertTriangle size={16} color={sev.color} style={{ flexShrink: 0 }} />
              )}

              {/* Task info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13, fontWeight: 500, margin: 0,
                  color: isDone ? "#64748b" : "var(--text-primary, #f8fafc)",
                  textDecoration: isDone ? "line-through" : "none",
                }}>
                  {task.task}
                </p>
                <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>
                  {task.category}
                  {task.file && <span> &middot; {task.file}</span>}
                </p>
              </div>

              {/* Severity badge */}
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                padding: "3px 8px", borderRadius: 6, flexShrink: 0,
                color: sev.color, backgroundColor: sev.bg,
                border: `1px solid ${sev.border}`,
              }}>
                {task.severity}
              </span>

              {/* Source badge */}
              <span style={{
                fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                padding: "3px 7px", borderRadius: 5, flexShrink: 0,
                color: "#60A5FA", background: "rgba(96,165,250,0.10)",
                border: "1px solid rgba(96,165,250,0.20)",
                display: "flex", alignItems: "center", gap: 3,
              }}>
                <Radar size={9} />
                SCAN
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
