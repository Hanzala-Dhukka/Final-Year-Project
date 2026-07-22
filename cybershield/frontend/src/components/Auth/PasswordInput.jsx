import { useState, useId } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

/**
 * Compute a light-weight password strength score (0–4) for inline feedback.
 * This is purely client-side UX — the backend enforces the real policy.
 */
function getPasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

const STRENGTH_META = [
  { label: "", color: "transparent" },
  { label: "Weak", color: "#ef4444" },
  { label: "Fair", color: "#f59e0b" },
  { label: "Good", color: "#3b82f6" },
  { label: "Strong", color: "#22c55e" },
];

export default function PasswordInput({
  id,
  value,
  onChange,
  error,
  showStrength = true,
  disabled = false,
  autoComplete = "current-password",
  ...rest
}) {
  const reactId = useId();
  const inputId = id || reactId;
  const [visible, setVisible] = useState(false);

  const strength = showStrength ? getPasswordStrength(value) : 0;
  const meta = STRENGTH_META[strength];
  const showStrengthBar = showStrength && value.length > 0;

  return (
    <div>
      <div
        className="cs-field"
        style={{
          borderColor: error ? "var(--cs-danger, #ef4444)" : undefined,
        }}
      >
        <Lock size={18} className="cs-field-icon" aria-hidden="true" />
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder="••••••••"
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className="cs-field-input"
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          className="cs-field-toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {showStrengthBar && (
        <div className="cs-strength" aria-hidden="true">
          <div className="cs-strength-track">
            <div
              className="cs-strength-fill"
              style={{
                width: `${(strength / 4) * 100}%`,
                backgroundColor: meta.color,
              }}
            />
          </div>
          <span className="cs-strength-label" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>
      )}
    </div>
  );
}
