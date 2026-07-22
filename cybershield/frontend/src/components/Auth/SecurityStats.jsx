import { useEffect, useState } from "react";
import { animate } from "framer-motion";

/** Trust indicators with count-up numbers (Module B1.1). */
const STATS = [
  { value: 1257, label: "Repositories Scanned Today", suffix: "" },
  { value: 98.7, label: "Threat Detection Accuracy", suffix: "%", decimals: 1 },
  { value: 24, label: "AI Security Monitoring", suffix: "/7" },
];

function format(n, decimals, suffix) {
  const v = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString();
  return v + suffix;
}

function Counter({ value, decimals = 0, suffix = "" }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    // Count up from 0 on mount (no in-view gating — the panel is always visible).
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span className="security-stat-value">
      {format(display, decimals, suffix)}
    </span>
  );
}

export default function SecurityStats() {
  return (
    <div className="security-stats">
      {STATS.map((s) => (
        <div className="security-stat" key={s.label}>
          <Counter value={s.value} decimals={s.decimals || 0} suffix={s.suffix} />
          <div className="security-stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
