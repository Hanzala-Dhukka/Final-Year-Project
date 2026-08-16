import { useState } from "react";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { resendVerification } from "../../services/authService";
import { useToast } from "../Animation/ToastProvider";
import "./VerificationBanner.css";

/**
 * Reusable banner shown when the logged-in account has not verified its email.
 * Renders nothing for verified users. Includes a button to resend the
 * verification email.
 */
export default function VerificationBanner({ message, className = "" }) {
  const { user } = useAuth();
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.is_verified) return null;

  const handleResend = async () => {
    if (!user.email || sending) return;
    setSending(true);
    try {
      const data = await resendVerification(user.email);
      if (data && data.warning) {
        toast.warning(data.warning);
        setSent(false);
      } else {
        setSent(true);
        toast.success("Verification code sent — check your inbox.");
      }
    } catch (error) {
      toast.error("Could not send the verification email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`cs-verify-banner ${className}`} role="alert">
      <div className="cs-verify-banner__icon">
        <Mail size={20} />
      </div>
      <div className="cs-verify-banner__text">
        <strong>Email verification required</strong>
        <span>{message || "Please verify your email to unlock all scanning features."}</span>
      </div>
      <div className="cs-verify-banner__action">
        {sent ? (
          <span className="cs-verify-banner__sent">
            <CheckCircle2 size={15} />
            Verification email sent
          </span>
        ) : (
          <button
            className="cs-verify-banner__btn"
            onClick={handleResend}
            disabled={sending}
          >
            <Send size={14} />
            {sending ? "Sending…" : "Send Verification Email"}
          </button>
        )}
      </div>
    </div>
  );
}