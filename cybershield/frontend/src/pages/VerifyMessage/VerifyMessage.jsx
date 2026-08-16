import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, CheckCircle, Send } from "lucide-react";
import { useToast } from "../../components/Animation/ToastProvider";
import { resendVerification } from "../../services/authService";
import "./VerifyMessage.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function VerifyMessage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const email = location.state?.email || "";
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      toast.error("We don't have your email on file — please use the resend page.");
      navigate("/resend-verification");
      return;
    }
    setResending(true);
    try {
      await resendVerification(email.trim());
      toast.success("A fresh verification code is on its way to your inbox.");
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.message;
      if (err.code === "ERR_NETWORK" || !err.response) {
        toast.error("Server unavailable — please try again shortly.");
      } else {
        toast.error(detail || "Could not resend verification email.");
      }
    } finally {
      setResending(false);
    }
    navigate("/verify-email", { state: { email: email.trim() } });
  };

  return (
    <div className="verify-message-page">
      <motion.div
        className="verify-message-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="verify-message-icon"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
        >
          <Mail size={34} />
        </motion.div>

        <h1>Check your email</h1>
        <p className="verify-message-sub">
          We've sent a 6-digit verification code to{" "}
          {email ? <strong>{email}</strong> : "your inbox"}. Enter the code to
          activate your CyberShield account. The code expires in 10 minutes.
        </p>

        <motion.div
          className="verify-message-check"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <CheckCircle size={16} />
          <span>Account created — pending verification</span>
        </motion.div>

        <div className="verify-message-actions">
          <button
            className="verify-message-primary"
            onClick={() => navigate("/verify-email", { state: { email } })}
          >
            Enter Verification Code
          </button>
          <button
            className="verify-message-secondary"
            onClick={handleResend}
            disabled={resending}
          >
            <Send size={14} />
            {resending ? "Sending…" : "Resend Code"}
          </button>
        </div>

        <p className="verify-message-foot">
          <Link to="/login">Go to Login</Link>
          {" · "}
          Wrong email? <Link to="/register">Register again</Link>
        </p>
      </motion.div>
    </div>
  );
}
