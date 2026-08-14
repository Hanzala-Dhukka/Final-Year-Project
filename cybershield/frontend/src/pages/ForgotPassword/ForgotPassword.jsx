import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Moon, Sun, KeyRound, ShieldCheck, Timer, MailCheck } from "lucide-react";
import { useTheme } from "../../theme/useTheme";
import CyberShieldLogo from "../../components/Auth/CyberShieldLogo";
import CyberBackground from "../../components/Auth/CyberBackground";
import ForgotPasswordForm from "./ForgotPasswordForm";
import "./styles.css";

const RECOVERY_NOTES = [
  { icon: Timer, title: "15-minute link", desc: "Secure, single-use reset link." },
  { icon: ShieldCheck, title: "Private & encrypted", desc: "Your account stays protected." },
  { icon: MailCheck, title: "Check your inbox", desc: "Reset emails only — never spam." },
];

/**
 * ForgotPassword page (Module B3) — enterprise-style recovery entry.
 * Glass card on the animated cyber background; the form handles the
 * email submission and success state. Fully theme-aware (dark/light).
 */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="cs-auth fp-page" data-theme-mode={isDark ? "dark" : "light"}>
      <CyberBackground />

      <button
        type="button"
        className="cs-theme-toggle"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <main className="cs-auth-form">
        <motion.div
          className="register-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="fp-brand">
            <CyberShieldLogo size={34} />
            <span className="fp-wordmark">CyberShield</span>
            <span className="fp-pill">Recovery</span>
          </div>

          <div className="register-head">
            <div className="fp-icon">
              <KeyRound size={24} />
              <span className="fp-icon-ring" aria-hidden="true" />
            </div>
            <h1>Forgot your password?</h1>
            <p>
              Enter the email linked to your account and we&apos;ll send you a secure
              link to reset your password.
            </p>
          </div>

          <ForgotPasswordForm onBack={() => navigate("/login")} />

          <div className="fp-notes" aria-hidden="true">
            {RECOVERY_NOTES.map(({ icon: Icon, title, desc }) => (
              <div className="fp-note" key={title}>
                <span className="fp-note-icon">
                  <Icon size={16} />
                </span>
                <div className="fp-note-text">
                  <strong>{title}</strong>
                  <span>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}