import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

/**
 * PasswordRules — live checklist validating the new password against the
 * same policy the backend enforces.
 */
const RULES = [
  { id: "len", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "Uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "Lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "num", label: "Number", test: (p) => /\d/.test(p) },
  { id: "sym", label: "Special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function PasswordRules({ password }) {
  return (
    <ul className="register-requirements" aria-label="Password requirements">
      {RULES.map((r) => {
        const met = password.length > 0 && r.test(password);
        return (
          <li key={r.id} className={met ? "met" : ""}>
            <span className="register-req-mark">
              <AnimatePresence mode="wait">
                {met ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </motion.span>
                ) : (
                  <span key="dot">•</span>
                )}
              </AnimatePresence>
            </span>
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}
