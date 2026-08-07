import { Filter } from "lucide-react";

const SEVERITIES = [
  { label: "All", color: "#94a3b8" },
  { label: "Critical", color: "#DC2626" },
  { label: "High", color: "#EA580C" },
  { label: "Medium", color: "#D97706" },
  { label: "Low", color: "#16A34A" },
];

export default function ChecklistFilter({
  categories = [],
  severity,
  category,
  onSeverity,
  onCategory,
}) {
  return (
    <div style={{
      background: "var(--glass-bg, rgba(17,24,39,0.70))",
      backdropFilter: "blur(12px)",
      border: "1px solid var(--glass-border, rgba(255,255,255,0.10))",
      borderRadius: 16, padding: 20,
      display: "flex", flexDirection: "column", gap: 20,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "rgba(37,99,235,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Filter size={16} color="#60A5FA" />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #f8fafc)" }}>
          Filters
        </span>
      </div>

      {/* Severity */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10, marginTop: 0 }}>
          Severity
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {SEVERITIES.map((s) => {
            const active = severity === s.label;
            return (
              <button
                key={s.label}
                onClick={() => onSeverity(s.label)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 8, border: "none",
                  background: active ? "rgba(37,99,235,0.15)" : "transparent",
                  cursor: "pointer", transition: "all 0.15s ease",
                  textAlign: "left",
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  backgroundColor: s.color,
                  boxShadow: active ? `0 0 8px ${s.color}60` : "none",
                }} />
                <span style={{
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? "#f8fafc" : "#94a3b8",
                }}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10, marginTop: 0 }}>
          Category
        </p>
        <select
          value={category}
          onChange={(e) => onCategory(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--glass-border, rgba(255,255,255,0.10))",
            borderRadius: 8, padding: "10px 12px",
            fontSize: 13, color: "var(--text-primary, #f8fafc)",
            outline: "none", cursor: "pointer",
          }}
        >
          <option value="All" style={{ background: "#1e293b" }}>All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c} style={{ background: "#1e293b" }}>{c}</option>
          ))}
        </select>
      </div>

      {/* Active filter count */}
      {(severity !== "All" || category !== "All") && (
        <button
          onClick={() => { onSeverity("All"); onCategory("All"); }}
          style={{
            padding: "8px 12px", borderRadius: 8,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#fca5a5", fontSize: 12, fontWeight: 500,
            cursor: "pointer", transition: "all 0.15s ease",
          }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
