import { useState, useId, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Shield,
  ShieldCheck,
  BookOpen,
  BrainCircuit,
  FileBarChart,
  Moon,
  Sun,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../theme/useTheme";
import CyberShieldLogo from "../../components/Auth/CyberShieldLogo";
import CyberBackground from "../../components/Auth/CyberBackground";
import AnimatedShield from "../../components/Auth/AnimatedShield";
import SecurityStats from "../../components/Auth/SecurityStats";
import SecureLoader from "../../components/Auth/SecureLoader";
import {
  cardEntrance,
  brandEntrance,
  successPop,
} from "../../animations/authAnimations";
import "./Login.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const REMEMBER_KEY = "cs_remember_me";

const FEATURES = [
  { icon: ShieldCheck, title: "GitHub Scanner", desc: "Continuous SAST analysis" },
  { icon: BookOpen, title: "OWASP Labs", desc: "Practice real attacks" },
  { icon: BrainCircuit, title: "AI Threat Modeling", desc: "Generate security models" },
  { icon: FileBarChart, title: "Security Reports", desc: "Audit-ready dashboards" },
];

const TYPING_PHRASES = [
  "Securing your session…",
  "AI threat detection active.",
  "Zero-trust architecture ready.",
  "Continuous monitoring enabled.",
];

const TIPS = [
  "Enable MFA for all administrator accounts.",
  "Rotate secrets immediately if a repo goes public.",
  "Scan dependencies on every pull request.",
  "Apply least-privilege to API tokens by default.",
  "Treat every dependency as code — scan it.",
];

/** Minimal typewriter hook (transform/opacity only — no layout cost). */
function useTypingEffect(phrases, speed = 45, pause = 1600) {
  const [text, setText] = useState("");
  const idx = useRef(0);
  const char = useRef(0);
  useEffect(() => {
    let timer;
    const tick = () => {
      const phrase = phrases[idx.current % phrases.length];
      if (char.current <= phrase.length) {
        setText(phrase.slice(0, char.current));
        char.current += 1;
        timer = setTimeout(tick, speed);
      } else {
        timer = setTimeout(() => {
          char.current = 0;
          idx.current += 1;
          tick();
        }, pause);
      }
    };
    tick();
    return () => clearTimeout(timer);
  }, [phrases, speed, pause]);
  return text;
}

/**
 * Login page (Module B1.1) — premium cybersecurity auth experience.
 * Cyber background + animated shield + live stats + secure-session loader.
 */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const emailId = useId();
  const pwId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem(REMEMBER_KEY) === "true"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const typing = useTypingEffect(TYPING_PHRASES);

  // Rotate the security tip every 5s.
  useEffect(() => {
    const id = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 5000);
    return () => clearInterval(id);
  }, []);

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    else if (password.length < MIN_PASSWORD_LENGTH)
      next.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    setErrors(next);
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    setTouched({ email: true, password: true });
    if (Object.keys(next).length) return;
    if (loading) return;

    setServerError("");
    setLoading(true);
    try {
      await login({ email: email.trim(), password, remember_me: rememberMe });
      try {
        if (rememberMe) localStorage.setItem(REMEMBER_KEY, "true");
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {}
      setSuccess(true);
      toast.success("Identity verified — welcome back!");
      setTimeout(() => {
        // First-time users go through onboarding; everyone else to dashboard.
        if (response.first_login) {
          navigate("/onboarding", { replace: true });
        } else {
          const from = location.state?.from?.pathname || "/dashboard";
          navigate(from, { replace: true });
        }
      }, 1400);
    } catch (err) {
      const status = err.response?.status;
      let message = "Incorrect email or password. Please try again.";
      if (err.code === "ERR_NETWORK" || !err.response)
        message = "Unable to reach the server. Check your connection.";
      else if (status === 503)
        message = "Service temporarily unavailable. Please try again shortly.";
      else if (status === 403)
        message = "Account not verified. Please check your email.";
      setServerError(message);
      setLoading(false);
    }
  };

  const emailError = touched.email ? errors.email : undefined;
  const passwordError = touched.password ? errors.password : undefined;

  return (
    <div className="login-page">
      <CyberBackground />

      {/* Theme toggle */}
      <button
        type="button"
        className="login-theme-toggle"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* LEFT — branding */}
      <motion.div className="login-left" {...brandEntrance}>
        <div className="login-brand">
          <AnimatedShield size={40} />
          <span className="login-brand-name">CyberShield</span>
        </div>

        <h1>
          Secure Your Code.
          <br />
          Protect Your Future.
        </h1>
        <p className="login-subtitle">
          AI-powered DevSecOps platform for secure software development.
        </p>

        <div className="login-typing" aria-hidden="true">
          {typing}
          <span className="caret" />
        </div>

        <SecurityStats />

        <div className="feature-list">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div className="feature-card" key={f.title}>
                <span className="feature-icon">
                  <Icon size={18} />
                </span>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="login-tip" aria-live="polite">
          <span className="login-tip-badge">Tip</span>
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIndex}
              className="login-tip-text"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {TIPS[tipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* RIGHT — login card */}
      <div className="login-right">
        <motion.div className="login-card" {...cardEntrance}>
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                className="login-success"
                variants={successPop}
                initial="initial"
                animate="animate"
              >
                <div className="login-success-check">
                  <Check size={32} strokeWidth={3} />
                </div>
                <p className="login-success-title">Identity Verified</p>
                <p className="login-success-sub">Redirecting to Dashboard…</p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="login-card-head">
                  <Shield className="login-card-shield" size={22} />
                  <h2>
                    Welcome Back <span aria-hidden="true">👋</span>
                  </h2>
                  <p>Sign in to continue to your dashboard.</p>
                </div>

                <AnimatePresence>
                  {serverError && (
                    <motion.div
                      className="login-alert"
                      role="alert"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <AlertCircle size={18} />
                      <span>{serverError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-group">
                    <label htmlFor={emailId}>Email</label>
                    <div
                      className="form-field"
                      style={{ borderColor: emailError ? "#f87171" : undefined }}
                    >
                      <Mail size={18} className="form-field-icon" />
                      <input
                        id={emailId}
                        type="email"
                        className="form-input"
                        placeholder="you@example.com"
                        value={email}
                        autoFocus
                        autoComplete="email"
                        aria-invalid={!!emailError}
                        disabled={loading}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => {
                          setTouched((t) => ({ ...t, email: true }));
                          validate();
                        }}
                      />
                    </div>
                    {emailError && <p className="form-error">{emailError}</p>}
                  </div>

                  <div className="form-group">
                    <label htmlFor={pwId}>Password</label>
                    <div
                      className="form-field password-wrapper"
                      style={{ borderColor: passwordError ? "#f87171" : undefined }}
                    >
                      <Lock size={18} className="form-field-icon" />
                      <input
                        id={pwId}
                        type={showPassword ? "text" : "password"}
                        className="form-input"
                        placeholder="••••••••"
                        value={password}
                        autoComplete="current-password"
                        aria-invalid={!!passwordError}
                        disabled={loading}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => {
                          setTouched((t) => ({ ...t, password: true }));
                          validate();
                        }}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordError && <p className="form-error">{passwordError}</p>}
                  </div>

                  <div className="login-options">
                    <label className="login-remember">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={loading}
                      />
                      <span>Remember me</span>
                    </label>
                    <Link to="/forgot-password">Forgot Password?</Link>
                  </div>

                  <button type="submit" className="login-button" disabled={loading}>
                    {loading ? (
                      <SecureLoader />
                    ) : (
                      <>
                        Sign In <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                <p className="login-switch">
                  Don&apos;t have an account?{" "}
                  <Link to="/register" className="login-link-strong">
                    Create Account
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
