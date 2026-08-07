import { TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react";

const levelColors = {
  Excellent: "#10B981",
  Good: "#3B82F6",
  Moderate: "#F59E0B",
  Critical: "#EF4444",
  Strong: "#10B981",
  Adequate: "#3B82F6",
  Weak: "#F59E0B",
};

/**
 * SecurityImprovement — shows before/after score comparison
 * with improvement amount and recent task completions.
 */
export default function SecurityImprovement({ data = null, history = [] }) {
  if (!data || !data.has_data) {
    return (
      <div style={{
        background: "var(--glass-bg, rgba(17,24,39,0.70))",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--glass-border, rgba(255,255,255,0.10))",
        borderRadius: 16, padding: 20, textAlign: "center",
      }}>
        <TrendingUp size={32} color="#475569" style={{ margin: "0 auto 12px" }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #f8fafc)", margin: 0 }}>
          No improvement data yet
        </p>
        <p style={{ fontSize: 12, color: "var(--text-secondary, #cbd5e1)", marginTop: 6 }}>
          Complete security tasks to track your improvement over time.
        </p>
      </div>
    );
  }

  const isPositive = data.improvement > 0;
  const isNeutral = data.improvement === 0;
  const oldColor = levelColors[data.old_level] || "#94a3b8";
  const newColor = levelColors[data.new_level] || "#94a3b8";

  // Recent completions from history
  const recentTasks = history
    .filter((h) => h.reason === "Task Completed")
    .slice(0, 5);

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
          background: isPositive ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <TrendingUp size={16} color={isPositive ? "#10B981" : "#64748b"} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #f8fafc)" }}>
          Security Improvement
        </span>
      </div>

      {/* Before / After */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16 }}>
        {/* Before */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "#64748b", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Before
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: oldColor, margin: "4px 0 0" }}>
            {Math.round(data.old_score)}%
          </p>
          <p style={{ fontSize: 10, color: "#64748b", margin: "2px 0 0" }}>{data.old_level}</p>
        </div>

        {/* Arrow + improvement */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <ArrowRight size={20} color={isPositive ? "#10B981" : "#64748b"} />
          {isPositive && (
            <span style={{
              fontSize: 14, fontWeight: 800, color: "#10B981",
              padding: "2px 8px", borderRadius: 6,
              background: "rgba(16,185,129,0.12)",
            }}>
              +{Math.round(data.improvement)}
            </span>
          )}
          {isNeutral && (
            <span style={{ fontSize: 11, color: "#64748b" }}>No change</span>
          )}
        </div>

        {/* After */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "#64748b", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            After
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: newColor, margin: "4px 0 0" }}>
            {Math.round(data.new_score)}%
          </p>
          <p style={{ fontSize: 10, color: "#64748b", margin: "2px 0 0" }}>{data.new_level}</p>
        </div>
      </div>

      {/* Tasks completed count */}
      {data.tasks_completed > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "8px 12px", borderRadius: 8,
          background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)",
          marginBottom: 14,
        }}>
          <CheckCircle2 size={14} color="#10B981" />
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            {data.tasks_completed} task{data.tasks_completed !== 1 ? "s" : ""} completed
          </span>
        </div>
      )}

      {/* Recent completions */}
      {recentTasks.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, marginTop: 0 }}>
            Recent Improvements
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {recentTasks.map((task, idx) => (
              <div key={idx} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 10px", borderRadius: 6,
                background: "rgba(255,255,255,0.02)",
              }}>
                <CheckCircle2 size={12} color="#10B981" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text-secondary, #cbd5e1)", flex: 1 }}>
                  {task.task_title || "Security task"}
                </span>
                {task.task_severity && (
                  <span style={{
                    fontSize: 9, fontWeight: 600, textTransform: "uppercase",
                    padding: "2px 5px", borderRadius: 3,
                    color: "#94a3b8", background: "rgba(255,255,255,0.04)",
                  }}>
                    {task.task_severity}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
