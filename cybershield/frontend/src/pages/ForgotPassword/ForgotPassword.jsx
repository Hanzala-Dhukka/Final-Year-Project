import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Moon, Sun, ShieldAlert } from "lucide-react";
import { useTheme } from "../../theme/useTheme";
import CyberShieldLogo from "../../components/Auth/CyberShieldLogo";
import CyberBackground from "../../components/Auth/CyberBackground";
import ForgotPasswordForm from "./ForgotPasswordForm";
import "./styles.css";

/**
 * ForgotPassword page (Module B3) — enterprise-style recovery entry.
 * Glass card on the animated cyber background; the form handles the
 * email submission and success state.
 */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [mode, setMode] = useState("form");

  return (
    <div className="cs-auth fp-page" data-theme-mode={isDark ? "dark" : "light"}>
      <CyberBackground />

      <button
        type="button"
        className="cs-theme-toggle"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
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
            <CyberShieldLogo size={32} />
            <span className="fp-wordmark">CyberShield</span>
          </div>

          <div className="register-head">
            <span className="fp-icon">
              <ShieldAlert size={22} />
            </span>
            <h2>Forgot your password?</h2>
            <p>No worries — enter your email and we&apos;ll send you instructions to reset it.</p>
          </div>

          <ForgotPasswordForm
            key={mode}
            onBack={() => {
              setMode("form");
              navigate("/login");
            }}
          />
        </motion.div>
      </main>
    </div>
  );
}
