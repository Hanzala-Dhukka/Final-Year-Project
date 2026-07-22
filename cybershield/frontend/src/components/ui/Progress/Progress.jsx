import { Check } from "lucide-react";
import "../Spinner/feedback.css";

/** Linear progress bar. variant: primary | success | warning | danger | info */
export function LinearProgress({ value = 0, variant = "primary", showLabel = false, label }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="cs-progress">
      {showLabel && (
        <div className="cs-progress__label">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div
        className="cs-progress__track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`cs-progress__bar ${variant !== "primary" ? `cs-progress__bar--${variant}` : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Circular progress. size in px, stroke width in px. */
export function CircularProgress({ value = 0, size = 80, stroke = 8, variant = "primary", children }) {
  const pct = Math.min(100, Math.max(0, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const color =
    variant === "success"
      ? "var(--success)"
      : variant === "warning"
      ? "var(--warning)"
      : variant === "danger"
      ? "var(--danger)"
      : variant === "info"
      ? "var(--info)"
      : "var(--primary)";
  return (
    <div className="cs-progress-circular" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 350ms var(--ease-in-out, ease)" }}
        />
      </svg>
      <span className="cs-progress-circular__text">{children || `${pct}%`}</span>
    </div>
  );
}

/** Step progress. steps: [{label}], current index (0-based). */
export function StepProgress({ steps = [], current = 0 }) {
  return (
    <div className="cs-steps">
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "";
        return (
          <div key={i} className={`cs-step ${state}`}>
            <div className="cs-step__line" />
            <div className="cs-step__dot">{i < current ? <Check size={16} /> : i + 1}</div>
            <div className="cs-step__label">{typeof s === "string" ? s : s.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default LinearProgress;
