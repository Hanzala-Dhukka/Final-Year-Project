import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Send, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "../../components/Animation/ToastProvider";
import { resendVerification } from "../../services/authService";
import "./ResendVerification.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResendVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // Prefill from the verify-email error screen or registration state if available
  const initialEmail = location.state?.email || "";
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!EMAIL_RE.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await resendVerification(email.trim());
      // Backend deliberately returns a generic message (anti-enumeration)
      setSent(true);
      toast.success("If that account exists, a verification link is on its way.");
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.message;
      if (err.code === "ERR_NETWORK" || !err.response) {
        toast.error("Server unavailable — please try again shortly.");
      } else {
        toast.error(detail || "Could not resend verification email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resend-page">
      <motion.div
        className="resend-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="resend-icon">
          <Mail size={30} />
        </div>
        <h1>Resend Verification Email</h1>
        <p className="resend-subtitle">
          Enter the email address you registered with and we'll send a fresh
          verification link.
        </p>

        {sent ? (
          <motion.div
            className="resend-success"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
          >
            <CheckCircle size={42} className="resend-success-check" />
            <h2>Check your inbox</h2>
            <p>
              We've sent a new verification link to{" "}
              <strong>{email.trim()}</strong>. The link expires in 24 hours.
            </p>
            <button
              className="resend-secondary"
              onClick={() => navigate("/login")}
            >
              Back to Login
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="resend-field">
              <label htmlFor="resend-email">Email Address</label>
              <div className="resend-input-wrap">
                <Mail size={18} className="resend-input-icon" />
                <input
                  id="resend-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" className="resend-submit" disabled={loading}>
              {loading ? (
                "Sending…"
              ) : (
                <>
                  <Send size={16} /> Resend Email
                </>
              )}
            </button>
          </form>
        )}

        <p className="resend-back">
          <Link to="/login">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
