import { useState, useId } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle2, ArrowLeft } from "lucide-react";
import Input from "../../components/ui/Input/Input";
import Button from "../../components/ui/Button";
import { useToast } from "../../components/Animation/ToastProvider";
import { cardEntrance, successPop } from "../../animations/authAnimations";
import { forgotPassword } from "../../services/authService";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordForm({ onBack }) {
  const toast = useToast();
  const emailId = useId();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    if (!email.trim()) return "Email is required.";
    if (!EMAIL_RE.test(email.trim())) return "Please enter a valid email address.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const msg = validate();
    setError(msg);
    if (msg || loading) return;

    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
      toast.success("Reset link sent — check your inbox.");
    } catch (err) {
      // Always show the generic success state to avoid account enumeration.
      if (err.code === "ERR_NETWORK" || !err.response) {
        toast.error("Unable to connect. Please try again later.");
        setLoading(false);
        return;
      }
      setSent(true);
      toast.success("If this email is registered, a reset link is on its way.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        className="cs-success"
        variants={successPop}
        initial="initial"
        animate="animate"
      >
        <div className="cs-success-check">
          <CheckCircle2 size={32} strokeWidth={2.5} />
        </div>
        <h2 className="cs-success-title">Email Sent</h2>
        <p className="cs-success-sub">
          Check your inbox for a secure reset link. The link expires in 15 minutes.
        </p>
        <Button
          variant="ghost"
          fullWidth
          className="cs-mt"
          onClick={onBack}
          leftIcon={<ArrowLeft size={16} />}
        >
          Back to Login
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="cs-form"
      noValidate
      {...cardEntrance}
    >
      <div className="cs-field-group">
        <Input
          id={emailId}
          label="Email Address"
          required
          type="email"
          placeholder="you@example.com"
          prefix={<Mail size={18} />}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (touched) setError(validate());
          }}
          onBlur={() => {
            setTouched(true);
            setError(validate());
          }}
          error={touched ? error : undefined}
          disabled={loading}
          autoFocus
          autoComplete="email"
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
        {loading ? "Sending…" : "Send Reset Link"}
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="cs-link cs-link--center"
        tabIndex={loading ? -1 : 0}
      >
        <ArrowLeft size={14} /> Remember password? Login
      </button>
    </motion.form>
  );
}
