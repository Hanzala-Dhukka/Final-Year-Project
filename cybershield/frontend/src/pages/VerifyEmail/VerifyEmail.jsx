import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ShieldCheck, KeyRound, ArrowLeft, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { verifyOtp, resendVerification } from "../../services/authService";
import { useToast } from "../../components/Animation/ToastProvider";
import "./VerifyEmail.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { isAuthenticated, refreshUser } = useAuth();

  // Prefill email from registration state or ?email= query param
  const initialEmail = location.state?.email || searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, error, success
  const [message, setMessage] = useState("");
  const otpRef = useRef(null);

  useEffect(() => {
    if (initialEmail && otpRef.current) otpRef.current.focus();
  }, [initialEmail]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!EMAIL_RE.test(email.trim())) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setStatus("error");
      setMessage("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({ email: email.trim(), otp: otp.trim() });
      if (isAuthenticated) {
        await refreshUser();
      }
      setStatus("success");
      setMessage("Email verified successfully! You can now log in.");
      toast.success("Email verified successfully!");
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.message;
      setStatus("error");
      setMessage(detail || "Invalid or expired verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      setStatus("error");
      setMessage("Please enter a valid email address first.");
      return;
    }
    setResending(true);
    try {
      await resendVerification(email.trim());
      setStatus("idle");
      toast.success("A new verification code has been sent to your email.");
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.message;
      toast.error(detail || "Could not resend the verification code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-page">
      <motion.div
        className="verify-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="verify-icon">
          <ShieldCheck size={30} />
        </div>
        <h1>Verify Your Email</h1>
        <p className="verify-subtitle">
          Enter the 6-digit code we emailed you to activate your account.
          The code expires in 10 minutes.
        </p>

        {status === "success" ? (
          <motion.div
            className="verify-success"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
          >
            <CheckCircle size={42} className="verify-success-check" />
            <h2>Email Verified!</h2>
            <p>{message}</p>
            <button
              className="verify-submit"
              onClick={() => navigate("/login", { replace: true })}
            >
              Go to Login
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleVerify} noValidate>
            <div className="verify-field">
              <label htmlFor="verify-email">Email Address</label>
              <div className="verify-input-wrap">
                <Mail size={18} className="verify-input-icon" />
                <input
                  id="verify-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || resending}
                />
              </div>
            </div>

            <div className="verify-field">
              <label htmlFor="verify-otp">Verification Code</label>
              <div className="verify-input-wrap">
                <KeyRound size={18} className="verify-input-icon" />
                <input
                  id="verify-otp"
                  ref={otpRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={loading}
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            {status === "error" && (
              <div className="verify-error">
                <AlertCircle size={15} />
                <span>{message}</span>
              </div>
            )}

            <button type="submit" className="verify-submit" disabled={loading || resending}>
              {loading ? "Verifying…" : "Verify Email"}
            </button>

            <button
              type="button"
              className="verify-resend"
              onClick={handleResend}
              disabled={resending}
            >
              <RefreshCw size={15} className={resending ? "verify-spin" : ""} />
              {resending ? "Sending…" : "Resend Verification Code"}
            </button>
          </form>
        )}

        <p className="verify-back">
          <Link to="/login">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default VerifyEmail;