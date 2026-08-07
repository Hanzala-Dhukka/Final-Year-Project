import { BarChart3 } from "lucide-react";

const levelColors = {
  Strong:   "#10B981",
  Adequate: "#3B82F6",
  Weak:     "#F59E0B",
  Critical: "#EF4444",
};

const categoryIcons = {
  Authentication: "🔐",
  Authorization: "🛡️",
  "Input Validation": "✅",
  Cryptography: "🔑",
  "Secrets Management": "🗝️",
  Logging: "📋",
  "Network Security": "🌐",
  "API Security": "🔌",
  "Database Security": "🗄️",
  "Cloud Security": "☁️",
  "Secure Coding": "💻",
};

/**
 * CategorySecurity — displays risk-weighted security levels per category
 * with colored progress bars and level labels.
 */
export default function CategorySecurity({ categories = {} }) {
  const entries = Object.entries(categories).sort((a, b) => a[1] - b[1]);

  if (entries.length === 0) {
    return (
      <div style={{
        background: "var(--glass-bg, rgba(17,24,39,0.70))",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--glass-border, rgba(255,255,255,0.10))",
        borderRadius: 16, padding: 20, textAlign: "center",
      }}>
        <BarChart3 size={32} color="#475569" style={{ margin: "0 auto 12px" }} />
        <p style={{ fontSize: 13, color: "var(--text-secondary, #cbd5e1)", margin: 0 }}>
          No category data yet. Complete tasks to see security levels.
        </p>
      </div>
    );
  }

  function getLevel(score) {
    if (score >= 80) return "Strong";
    if (score >= 60) return "Adequate";
    if (score >= 40) return "Weak";
    return "Critical";
  }

  function getBarColor(score) {
    if (score >= 80) return "#10B981";
    if (score >= 60) return "#3B82F6";
    if (score >= 40) return "#F59E0B";
    return "#EF4444";
  }

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
          background: "rgba(139,92,246,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <BarChart3 size={16} color="#A78BFA" />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #f8fafc)" }}>
          Category Security Levels
        </span>
      </div>

      {/* Category bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {entries.map(([name, score]) => {
          const pct = Math.round(score) || 0;
          const level = getLevel(pct);
          const barColor = getBarColor(pct);

          return (
            <div key={name}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{categoryIcons[name] || "📌"}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 500, color: "var(--text-primary, #f8fafc)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {name}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                    padding: "2px 6px", borderRadius: 4,
                    color: levelColors[level] || "#94a3b8",
                    background: `${levelColors[level] || "#94a3b8"}15`,
                  }}>
                    {level}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: barColor, minWidth: 32, textAlign: "right" }}>
                    {pct}%
                  </span>
                </div>
              </div>
              {/* Bar */}
              <div style={{
                width: "100%", height: 6, borderRadius: 3,
                background: "rgba(255,255,255,0.06)", overflow: "hidden",
              }}>
                <div style={{
                  width: `${pct}%`, height: "100%", borderRadius: 3,
                  background: barColor,
                  transition: "width 0.5s ease",
                  boxShadow: `0 0 8px ${barColor}40`,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
