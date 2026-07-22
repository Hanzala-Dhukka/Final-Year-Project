import { forwardRef, useState } from "react";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import "./field.css";
import "./PasswordInput.css";

/** Lightweight password strength estimate (0–4). */
export function getPasswordStrength(pw = "") {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
  "var(--danger)",
  "var(--danger)",
  "var(--warning)",
  "var(--info)",
  "var(--success)",
];

/**
 * CyberShield PasswordInput
 * Show/hide toggle, strength meter, caps-lock warning.
 */
const PasswordInput = forwardRef(function PasswordInput(
  { label, showStrength = true, required = false, error, id, className = "", ...rest },
  ref
) {
  const [visible, setVisible] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const fieldId = id || rest.name;

  const strength = getPasswordStrength(rest.value || "");

  return (
    <div className={`cs-field ${error ? "cs-field--error" : ""} ${className}`}>
      {label && (
        <label className="cs-field__label" htmlFor={fieldId}>
          {label}
          {required && <span className="cs-field__required">*</span>}
        </label>
      )}
      <div className="cs-field__control">
        <input
          ref={ref}
          id={fieldId}
          type={visible ? "text" : "password"}
          className="cs-field__input"
          aria-invalid={error ? true : undefined}
          onKeyUp={(e) => setCapsOn(e.getModifierState?.("CapsLock") || false)}
          onKeyDown={(e) => setCapsOn(e.getModifierState?.("CapsLock") || false)}
          {...rest}
        />
        <button
          type="button"
          className="cs-field__suffix cs-field__suffix--button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {capsOn && (
        <span className="cs-pw__caps">
          <AlertTriangle size={12} /> Caps Lock is on
        </span>
      )}

      {showStrength && rest.value && (
        <div className="cs-pw__strength" aria-hidden="true">
          <div className="cs-pw__bars">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="cs-pw__bar"
                style={{
                  background: i < strength ? STRENGTH_COLORS[strength] : "var(--border-strong)",
                }}
              />
            ))}
          </div>
          <span className="cs-pw__label" style={{ color: STRENGTH_COLORS[strength] }}>
            {STRENGTH_LABELS[strength]}
          </span>
        </div>
      )}

      {error && <span className="cs-field__error">{error}</span>}
    </div>
  );
});

export default PasswordInput;
