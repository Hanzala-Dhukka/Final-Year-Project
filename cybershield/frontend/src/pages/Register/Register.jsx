import { useState, useId } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Check } from "lucide-react";
import AuthIllustration from "../../components/Auth/AuthIllustration";
import PasswordStrength from "../../components/Auth/PasswordStrength";
import AuthInput from "../../components/Auth/AuthInput";
import SocialLogin from "../../components/Auth/SocialLogin";
import { useToast } from "../../components/Animation/ToastProvider";
import { registerUser } from "../../services/authService";
import "./Register.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();

  const nameId = useId();
  const emailId = useId();
  const pwId = useId();
  const cpwId = useId();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const setField = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (touched[key]) validate({ ...form, [key]: value });
  };

  const validate = (data = form) => {
    const next = {};
    if (!data.name.trim()) next.name = "Full name is required.";
    if (!data.email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(data.email.trim())) next.email = "Enter a valid email address.";
    if (!data.password) next.password = "Password is required.";
    else if (data.password.length < MIN_PASSWORD)
      next.password = `Password must be at least ${MIN_PASSWORD} characters.`;
    if (!data.confirm) next.confirm = "Please confirm your password.";
    else if (data.confirm !== data.password) next.confirm = "Passwords do not match.";
    setErrors(next);
    return next;
  };

  const handleBlur = (key) => () => {
    setTouched((t) => ({ ...t, [key]: true }));
    validate();
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = validate();
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (Object.keys(next).length || loading) return;

    setLoading(true);
    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setSuccess(true);
      toast.success("Account created — verify your email to continue.");
      setTimeout(
        () => navigate("/verify-message", { state: { email: form.email.trim() }, replace: true }),
        1600
      );
    } catch (err) {
      const code = err.response?.status;
      const detail = err.response?.data?.detail || err.response?.data?.message;
      if (code === 400 || code === 409)
        toast.error(detail || "An account with this email already exists.");
      else if (err.code === "ERR_NETWORK" || !err.response)
        toast.error("Server unavailable — please try again shortly.");
      else toast.error(detail || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const show = (key) => (touched[key] ? errors[key] : undefined);

  return (
    <div className="register-page">
      <AuthIllustration />

      <motion.div
        className="register-card"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              className="register-success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
            >
              <div className="register-success-check">
                <Check size={34} strokeWidth={3} />
              </div>
              <h2>Account Created</h2>
              <p>Check your inbox to verify your email and activate your account.</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1>Create Account</h1>

              <form onSubmit={submit} noValidate>
                <AuthInput
                  id={nameId}
                  label="Full Name"
                  placeholder="Full Name"
                  icon={<User size={18} />}
                  value={form.name}
                  onChange={setField("name")}
                  onBlur={handleBlur("name")}
                  error={show("name")}
                  disabled={loading}
                  autoFocus
                />

                <AuthInput
                  id={emailId}
                  label="Email Address"
                  type="email"
                  placeholder="Email Address"
                  icon={<Mail size={18} />}
                  value={form.email}
                  onChange={setField("email")}
                  onBlur={handleBlur("email")}
                  error={show("email")}
                  disabled={loading}
                />

                <AuthInput
                  id={pwId}
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  icon={<Lock size={18} />}
                  value={form.password}
                  onChange={setField("password")}
                  onBlur={handleBlur("password")}
                  error={show("password")}
                  disabled={loading}
                  suffix={
                    <button
                      type="button"
                      className="auth-input-toggle"
                      onClick={() => setShowPassword((s) => !s)}
                      disabled={loading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
                <PasswordStrength password={form.password} />

                <AuthInput
                  id={cpwId}
                  label="Confirm Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  icon={<Lock size={18} />}
                  value={form.confirm}
                  onChange={setField("confirm")}
                  onBlur={handleBlur("confirm")}
                  error={show("confirm")}
                  disabled={loading}
                />

                <button type="submit" className="register-submit" disabled={loading}>
                  {loading ? "Creating Account…" : "Create Account"}
                </button>
              </form>

              <SocialLogin />

              <p className="login-link">
                Already have account? <Link to="/login">Login</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
