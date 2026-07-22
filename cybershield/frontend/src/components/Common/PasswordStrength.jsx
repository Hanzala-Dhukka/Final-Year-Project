import { motion } from "framer-motion";

/**
 * PasswordStrength — lightweight, reusable strength meter.
 * Score 0–4 from length / uppercase / digit / special-character checks.
 * Styling lives in components/Common/common-auth.css.
 */
function getPasswordScore(password = "") {
  if (!password) return 0;
  let score = 0;
  if (password.length > 7) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[@$!%*?&]/.test(password)) score += 1;
  return score;
}

const LABELS = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
const COLORS = ["#ef4444", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];

export default function PasswordStrength({ password = "" }) {
  const strength = getPasswordScore(password);
  const pct = Math.max(strength, 1) * 25;
  const color = COLORS[strength];

  return (
    <div className="cs-pwd-strength" aria-hidden={password ? undefined : "true"}>
      <div className="cs-pwd-strength-row">
        <span>Strength:</span>
        <span className="cs-pwd-strength-label" style={{ color }}>
          {password ? LABELS[strength] : "—"}
        </span>
      </div>
      <div className="cs-pwd-strength-bar">
        <motion.div
          className="cs-pwd-strength-fill"
          animate={{ width: `${pct}%`, backgroundColor: color }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
