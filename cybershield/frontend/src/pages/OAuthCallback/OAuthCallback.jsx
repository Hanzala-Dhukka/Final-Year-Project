/**
 * OAuthCallback — landing page for the backend's social-login redirect.
 * Reads access/refresh tokens (or an error) from the query string,
 * completes the authenticated session, then routes to onboarding or dashboard.
 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import AnimatedShield from "../../components/Auth/AnimatedShield";
import CyberBackground from "../../components/Auth/CyberBackground";
import "./OAuthCallback.css";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithTokens } = useAuth();

  const error = searchParams.get("error");
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const firstLogin = searchParams.get("first_login") === "true";

  const [state, setState] = useState(error ? "error" : "processing");
  const [message, setMessage] = useState(error || "");

  useEffect(() => {
    if (error) {
      setState("error");
      setMessage(error);
      return;
    }
    if (!accessToken) {
      setState("error");
      setMessage("Missing authentication response. Please try logging in again.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await loginWithTokens({ access_token: accessToken, refresh_token: refreshToken });
        if (cancelled) return;
        setState("success");
        setTimeout(() => {
          navigate(firstLogin ? "/onboarding" : "/dashboard", { replace: true });
        }, 900);
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setMessage("We couldn't complete the login. Please try again.");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="oauth-callback-page">
      <CyberBackground />

      <motion.div
        className="oauth-callback-card"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="oauth-callback-brand">
          <AnimatedShield size={40} />
          <span className="oauth-callback-brand-name">CyberShield</span>
        </div>

        {state === "processing" && (
          <div className="oauth-callback-status">
            <Loader2 className="oauth-callback-spinner" size={40} />
            <h1>Completing sign in…</h1>
            <p>Validating your secure session.</p>
          </div>
        )}

        {state === "success" && (
          <div className="oauth-callback-status">
            <motion.div
              className="oauth-callback-check"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 18 }}
            >
              <ShieldCheck size={36} strokeWidth={2.5} />
            </motion.div>
            <h1>Authenticated</h1>
            <p>You are signed in. Redirecting to your dashboard…</p>
          </div>
        )}

        {state === "error" && (
          <div className="oauth-callback-status">
            <div className="oauth-callback-error-icon">
              <AlertTriangle size={36} />
            </div>
            <h1>Sign in failed</h1>
            <p className="oauth-callback-error-text">{message}</p>
            <button
              type="button"
              className="oauth-callback-back"
              onClick={() => navigate("/login", { replace: true })}
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}