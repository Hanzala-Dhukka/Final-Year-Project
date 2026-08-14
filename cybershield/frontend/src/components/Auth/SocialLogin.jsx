/**
 * SocialLogin — working Google/GitHub OAuth entry buttons.
 * Each button asks the backend for the provider's authorization URL,
 * then redirects the browser there. The backend later redirects back to
 * /oauth/callback with tokens (or an error).
 */
import { useState } from "react";
import { useToast } from "../Animation/ToastProvider";
import { getOAuthAuthorizationUrl } from "../../services/authService";
import "./SocialLogin.css";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
    </svg>
  );
}

const PROVIDERS = [
  { id: "google", label: "Google", icon: <GoogleIcon /> },
  { id: "github", label: "GitHub", icon: <GithubIcon /> },
];

export default function SocialLogin() {
  const toast = useToast();
  const [loadingProvider, setLoadingProvider] = useState(null);

  const handleClick = async (providerId) => {
    if (loadingProvider) return;

    setLoadingProvider(providerId);
    try {
      const url = await getOAuthAuthorizationUrl(providerId);
      // Full-page redirect: the OAuth consent screen takes over and the
      // backend returns us to /oauth/callback once finished.
      window.location.href = url;
    } catch (error) {
      const detail =
        error?.response?.data?.detail ||
        "Could not start social login. Please try again.";
      toast.error(detail);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="social-login">
      <div className="social-divider">
        <span>OR continue with</span>
      </div>

      <div className="social-buttons">
        {PROVIDERS.map(({ id, label, icon }) => {
          const isLoading = loadingProvider === id;
          return (
            <button
              key={id}
              type="button"
              className={`social-btn social-btn--${id}`}
              onClick={() => handleClick(id)}
              disabled={loadingProvider !== null}
            >
              {isLoading ? (
                <span className="social-btn__spinner" aria-hidden="true" />
              ) : (
                icon
              )}
              <span>{isLoading ? "Redirecting…" : label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
