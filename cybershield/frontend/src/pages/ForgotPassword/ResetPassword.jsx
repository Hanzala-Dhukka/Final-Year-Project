import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Moon, Sun, Lock } from "lucide-react";
import { useTheme } from "../../theme/useTheme";
import CyberShieldLogo from "../../components/Auth/CyberShieldLogo";
import CyberBackground from "../../components/Auth/CyberBackground";
import ResetPasswordForm from "./ResetPasswordForm";
import "../../components/Common/common-auth.css";
import "./styles.css";

/**
 * ResetPassword page (Module B3) — secure new-password entry.
 * Token comes from the URL path (/reset-password/:token) or the query (?token=).
 * If no token is present we show a friendly "request a new link" prompt.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const { token: pathToken } = useParams();
  const [searchParams] = useSearchParams();
  const { isDark, toggleTheme } = useTheme();

  const token = pathToken || searchParams.get("token");
  const goForgot = () => navigate("/forgot-password");
  const goLogin = () => navigate("/login");

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

          {token ? (
            <>
              <div className="register-head">
                <span className="fp-icon">
                  <Lock size={22} />
                </span>
                <h2>Create New Password</h2>
                <p>Choose a strong password you don&apos;t use elsewhere.</p>
              </div>
              <ResetPasswordForm token={token} onBack={goForgot} onSuccess={goLogin} />
            </>
          ) : (
            <div className="cs-success">
              <div className="cs-success-check" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                <Lock size={32} strokeWidth={2.5} />
              </div>
              <h2 className="cs-success-title">Secure Link Required</h2>
              <p className="cs-success-sub">
                No reset token was found. Please use the link from your email, or request a new one.
              </p>
              <button type="button" className="cs-submit cs-mt" onClick={goForgot}>
                Request Reset Link
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
