import { useState, useId } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import Input from "../../components/ui/Input/Input";
import Button from "../../components/ui/Button";
import { useToast } from "../../components/Animation/ToastProvider";
import { cardEntrance, successPop } from "../../animations/authAnimations";
import { resetPassword } from "../../services/authService";
import PasswordStrength from "./PasswordStrength";
import PasswordRules from "./PasswordRules";

const RULES = [
  (p) => p.length >= 8,
  (p) => /[A-Z]/.test(p),
  (p) => /[a-z]/.test(p),
  (p) => /\d/.test(p),
  (p) => /[^A-Za-z0-9]/.test(p),
];

export default function ResetPasswordForm({ token, onBack, onSuccess }) {
  const toast = useToast();
  const pwId = useId();
  const cpwId = useId();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | success | expired | error

  const meetsPolicy = RULES.every((r) => r(password));
  const confirmMatch = confirm.length > 0 && confirm === password;

  const validate = () => {
    const next = {};
    if (!meetsPolicy) next.password = "Password does not meet all requirements.";
    if (!confirm) next.confirm = "Please confirm your password.";
    else if (!confirmMatch) next.confirm = "Passwords do not match.";
    setErrors(next);
    return next;
  };

  const handleBlur = (field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    validate();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    const next = validate();
    if (Object.keys(next).length || loading) return;

    setLoading(true);
    try {
      await resetPassword({ token, password });
      setStatus("success");
      toast.success("Password updated successfully.");
      setTimeout(() => onSuccess?.(), 1800);
    } catch (err) {
      const code = err.response?.status;
      const detail = err.response?.data?.detail || err.response?.data?.message;
      if (code === 400 || code === 422 || code === 401) {
        setStatus("expired");
        toast.error("This reset link is invalid or has expired.");
      } else if (err.code === "ERR_NETWORK" || !err.response) {
        setStatus("error");
        toast.error("Unable to connect. Please try again later.");
      } else {
        setStatus("error");
        toast.error(detail || "Could not reset your password. Please try again.");
      }
      setLoading(false);
    }
  };

  if (status === "expired") {
    return (
      <motion.div className="cs-success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="cs-success-check" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
          <AlertTriangle size={32} strokeWidth={2.5} />
        </div>
        <h2 className="cs-success-title">Link Expired</h2>
        <p className="cs-success-sub">This reset link is invalid or has expired. Request a new one to continue.</p>
        <Button variant="primary" fullWidth className="cs-mt" onClick={onBack} leftIcon={<ArrowLeft size={16} />}>
          Request New Link
        </Button>
      </motion.div>
    );
  }

  if (status === "success") {
    return (
      <motion.div className="cs-success" variants={successPop} initial="initial" animate="animate">
        <div className="cs-success-check">
          <CheckCircle2 size={32} strokeWidth={2.5} />
        </div>
        <h2 className="cs-success-title">Password Updated!</h2>
        <p className="cs-success-sub">Your password has been changed successfully. Redirecting to login…</p>
      </motion.div>
    );
  }

  return (
    <motion.form onSubmit={handleSubmit} className="cs-form" noValidate {...cardEntrance}>
      <div className="cs-field-group">
        <Input
          id={pwId}
          label="New Password"
          required
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          prefix={<Lock size={18} />}
          suffix={
            <button
              type="button"
              className="cs-field-toggle"
              onClick={() => setShowPassword((s) => !s)}
              disabled={loading}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (touched.password || touched.confirm) validate();
          }}
          onBlur={handleBlur("password")}
          error={touched.password ? errors.password : undefined}
          disabled={loading}
          autoFocus
          autoComplete="new-password"
        />
        {password && (
          <>
            <PasswordStrength password={password} />
            <PasswordRules password={password} />
          </>
        )}
      </div>

      <div className="cs-field-group">
        <Input
          id={cpwId}
          label="Confirm Password"
          required
          type={showConfirm ? "text" : "password"}
          placeholder="••••••••"
          prefix={<Lock size={18} />}
          suffix={
            <button
              type="button"
              className="cs-field-toggle"
              onClick={() => setShowConfirm((s) => !s)}
              disabled={loading}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (touched.confirm) validate();
          }}
          onBlur={handleBlur("confirm")}
          error={touched.confirm ? errors.confirm : undefined}
          success={confirmMatch}
          disabled={loading}
          autoComplete="new-password"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        rightIcon={!loading && <ArrowRight size={18} />}
      >
        {loading ? "Resetting…" : "Reset Password"}
      </Button>

      <button type="button" onClick={onBack} className="cs-link cs-link--center" tabIndex={loading ? -1 : 0}>
        <ArrowLeft size={14} /> Back to Login
      </button>
    </motion.form>
  );
}
