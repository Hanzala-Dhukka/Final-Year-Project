/**
 * Progress bar (spec Step 13). Small reusable filled bar.
 */
export default function ProgressBar({ value, max = 100, label }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <div className="cs-ow-field">
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-secondary, #94a3b8)" }}>
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div
        style={{
          width: "100%",
          height: 8,
          borderRadius: 999,
          background: "var(--surface-hover, rgba(26, 36, 56, 0.7))",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 999,
            background: "linear-gradient(90deg, #7c3aed, #2563eb)",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}