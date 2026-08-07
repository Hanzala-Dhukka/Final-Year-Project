import { Sparkles, AlertTriangle, CheckCircle2, Zap, ExternalLink } from "lucide-react";
import colors from "../../styles/colors";

const priorityConfig = {
  Critical: { color: colors.critical, bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.25)" },
  High:     { color: colors.high,     bg: "rgba(234,88,12,0.12)",  border: "rgba(234,88,12,0.25)" },
  Medium:   { color: colors.medium,   bg: "rgba(217,119,6,0.12)",  border: "rgba(217,119,6,0.25)" },
  Low:      { color: colors.low,      bg: "rgba(22,163,74,0.12)",  border: "rgba(22,163,74,0.25)" },
};

const sourceLabels = {
  AI_RECOMMENDATION: { label: "AI", color: "#A78BFA", bg: "rgba(167,139,250,0.10)" },
  RULE_RECOMMENDATION: { label: "RULE", color: "#60A5FA", bg: "rgba(96,165,250,0.10)" },
  SCAN_RECOMMENDATION: { label: "SCAN", color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
};

/**
 * AIRecommendationWidget — displays AI-generated security recommendations
 * with priority badges, source labels, and action buttons.
 */
export default function AIRecommendationWidget({ tasks = [], loading = false }) {
  if (loading) {
    return (
      <div style={{
        background: "var(--glass-bg, rgba(17,24,39,0.70))",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--glass-border, rgba(255,255,255,0.10))",
        borderRadius: 16, padding: 24, textAlign: "center",
        color: "var(--text-secondary, #cbd5e1)", fontSize: 13,
      }}>
        Generating AI recommendations...
      </div>
    );
  }

  // Filter to only AI/rule generated tasks (not regular checklist items)
  const aiTasks = tasks.filter(
    (t) => t.source === "AI_RECOMMENDATION" || t.source === "RULE_RECOMMENDATION"
  );

  if (aiTasks.length === 0) {
    return (
      <div style={{
        background: "var(--glass-bg, rgba(17,24,39,0.70))",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--glass-border, rgba(255,255,255,0.10))",
        borderRadius: 16, padding: 24, textAlign: "center",
      }}>
        <Sparkles size={32} color="#475569" style={{ margin: "0 auto 12px" }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #f8fafc)", margin: 0 }}>
          No AI recommendations yet
        </p>
        <p style={{ fontSize: 12, color: "var(--text-secondary, #cbd5e1)", marginTop: 6 }}>
          Run a scan and generate from findings to get AI-powered recommendations.
        </p>
      </div>
    );
  }

  // Group by priority
  const grouped = {
    Critical: aiTasks.filter((t) => t.severity === "Critical"),
    High: aiTasks.filter((t) => t.severity === "High"),
    Medium: aiTasks.filter((t) => t.severity === "Medium"),
    Low: aiTasks.filter((t) => t.severity === "Low"),
  };

  return (
    <div style={{
      background: "var(--glass-bg, rgba(17,24,39,0.70))",
      backdropFilter: "blur(12px)",
      border: "1px solid var(--glass-border, rgba(255,255,255,0.10))",
      borderRadius: 16, padding: 20,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(167,139,250,0.25)",
        }}>
          <Sparkles size={18} color="#fff" />
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #f8fafc)", margin: 0 }}>
            AI Recommended Actions
          </h3>
          <p style={{ fontSize: 11, color: "var(--text-secondary, #cbd5e1)", margin: 0, marginTop: 2 }}>
            {aiTasks.length} recommendation{aiTasks.length !== 1 ? "s" : ""} generated
          </p>
        </div>
      </div>

      {/* Grouped tasks */}
      {Object.entries(grouped).map(([priority, items]) => {
        if (items.length === 0) return null;
        const config = priorityConfig[priority] || priorityConfig.Medium;

        return (
          <div key={priority} style={{ marginBottom: 14 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
              color: config.color, marginBottom: 8, marginTop: 0,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                backgroundColor: config.color,
              }} />
              {priority} ({items.length})
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map((task, idx) => {
                const src = sourceLabels[task.source] || sourceLabels.RULE_RECOMMENDATION;
                const isDone = task.status === "completed";

                return (
                  <div
                    key={task.checklist_id || idx}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 10,
                      background: isDone ? "rgba(17,24,39,0.30)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isDone ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)"}`,
                      opacity: isDone ? 0.5 : 1,
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle size={16} color={config.color} style={{ flexShrink: 0 }} />
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 13, fontWeight: 500, margin: 0,
                        color: isDone ? "#64748b" : "var(--text-primary, #f8fafc)",
                        textDecoration: isDone ? "line-through" : "none",
                      }}>
                        {task.title || task.task}
                      </p>
                      {(task.description || task.category) && (
                        <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>
                          {task.category}
                          {task.file && <span> &middot; {task.file}</span>}
                        </p>
                      )}
                    </div>

                    {/* Source badge */}
                    <span style={{
                      fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                      padding: "3px 6px", borderRadius: 4, flexShrink: 0,
                      color: src.color, background: src.bg,
                      display: "flex", alignItems: "center", gap: 3,
                    }}>
                      {task.source === "AI_RECOMMENDATION" && <Sparkles size={9} />}
                      {src.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
