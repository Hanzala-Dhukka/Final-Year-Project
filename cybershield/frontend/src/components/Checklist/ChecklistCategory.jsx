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

function barColor(score) {
  if (score >= 80) return "#10B981";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

export default function ChecklistCategory({ category, total, completed, score }) {
  const pct = Math.round(score) || 0;
  const filled = Math.round((pct / 100) * 10);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 14 }}>{categoryIcons[category] || "📌"}</span>
          <span style={{
            fontSize: 13, fontWeight: 500, color: "var(--text-primary, #f8fafc)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {category}
          </span>
        </div>
        <span style={{
          fontSize: 12, fontWeight: 600, color: barColor(score),
          flexShrink: 0, marginLeft: 12,
        }}>
          {pct}%
        </span>
      </div>
      {/* 10-segment bar */}
      <div style={{ display: "flex", gap: 3 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 6, borderRadius: 3,
              backgroundColor: i < filled ? barColor(score) : "rgba(255,255,255,0.06)",
              transition: "background-color 0.3s ease",
              boxShadow: i < filled ? `0 0 8px ${barColor(score)}40` : "none",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
        <span style={{ fontSize: 11, color: "#64748b" }}>
          {completed}/{total}
        </span>
      </div>
    </div>
  );
}
