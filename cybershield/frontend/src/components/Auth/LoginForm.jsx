import { useState, useId } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import PasswordInput from "./PasswordInput";
import RememberMe from "./RememberMe";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Backend minimum password length (kept in sync with the auth service).
const MIN_PASSWORD_LENGTH = 8;

/** Read the persisted "remember me" preference (used to pre-fill the form). */
function getRememberedPreference() {
  try {
    return localStorage.getItem("cs_remember_me") === "true";
  } catch {
    return false;
  }
}

function validate({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(email.trim()))
    errors.email = "Enter a valid email address.";

  if (!password) errors.password = "Password is required.";
  else if (password.length < MIN_PASSWORD_LENGTH)
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;

  return errors;
}

/**
 * LoginForm — presentation + client-side validation only.
 * All network/state logic is delegated to the `onSubmit` callback (wired to
 * the AuthContext in the Login page).
 */
export default function LoginForm({ onSubmit, loading = false, serverError }) {
  const emailId = useId();
  const pwId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(getRememberedPreference());
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setField = (setter) => (e) => {
    setter(e.target.value);
    if (Object.keys(errors).length) setErrors(validate({ email, password }));
  };

  const handleBlur = (field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate({ email, password }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validate({ email, password });
    setErrors(nextErrors);
    setTouched({ email: true, password: true });
    if (Object.keys(nextErrors).length > 0) return;

    // Prevent duplicate submissions while a request is in flight.
    if (loading) return;

    onSubmit({ email: email.trim(), password, rememberMe });
  };

  const emailError = touched.email ? errors.email : undefined;
  const passwordError = touched.password ? errors.password : undefined;

  return (
    <form onSubmit={handleSubmit} className="cs-form" noValidate>
      <AnimatePresence>
        {serverError && (
          <motion.div
            className="cs-alert cs-alert--error"
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <AlertCircle size={18} className="cs-alert-icon" />
            <span>{serverError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email */}
      <div className="cs-field-group">
        <label htmlFor={emailId} className="cs-label">
          Email
        </label>
        <div
          className="cs-field"
          style={{
            borderColor: emailError ? "var(--cs-danger)" : undefined,
          }}
        >
          <Mail size={18} className="cs-field-icon" aria-hidden="true" />
          <input
            id={emailId}
            type="email"
            value={email}
            onChange={setField(setEmail)}
            onBlur={handleBlur("email")}
            disabled={loading}
            autoFocus
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!emailError}
            aria-describedby={emailError ? `${emailId}-error` : undefined}
            className="cs-field-input"
          />
        </div>
        <AnimatePresence>
          {emailError && (
            <motion.p
              id={`${emailId}-error`}
              className="cs-field-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
            >
              {emailError}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Password */}
      <div className="cs-field-group">
        <div className="cs-label-row">
          <label htmlFor={pwId} className="cs-label">
            Password
          </label>
          <Link to="/forgot-password" className="cs-link" tabIndex={loading ? -1 : 0}>
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id={pwId}
          value={password}
          onChange={setField(setPassword)}
          onBlur={handleBlur("password")}
          error={passwordError}
          disabled={loading}
        />
        <AnimatePresence>
          {passwordError && (
            <motion.p
              id={`${pwId}-error`}
              className="cs-field-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
            >
              {passwordError}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Remember me */}
      <div className="cs-row-between">
        <RememberMe
          checked={rememberMe}
          onChange={setRememberMe}
          disabled={loading}
        />
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        className="cs-submit"
        disabled={loading}
        whileHover={loading ? undefined : { scale: 1.01 }}
        whileTap={loading ? undefined : { scale: 0.99 }}
        aria-busy={loading}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="cs-spin" />
            Signing In…
          </>
        ) : (
          <>
            Sign In
            <ArrowRight size={18} />
          </>
        )}
      </motion.button>

      {/* Register link */}
      <p className="cs-switch">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="cs-link cs-link--strong">
          Create Account
        </Link>
      </p>
    </form>
  );
}
