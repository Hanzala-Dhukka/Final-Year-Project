import { useState } from "react";
import { motion } from "framer-motion";
import { PartyPopper, ArrowRight, Loader2 } from "lucide-react";
import { completeOnboarding } from "../../services/onboardingService";

export default function FinishStep({ form, navigate, toast }) {
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await completeOnboarding({
        name: form.name,
        avatar: form.avatar,
        bio: form.bio,
        skill_level: form.skill_level,
        learning_goals: form.learning_goals,
      });
      toast.success("Setup complete — welcome to CyberShield!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const detail =
        err.response?.data?.detail || "Could not save your preferences.";
      toast.error(detail);
      setSaving(false);
    }
  };

  return (
    <div className="ob-finish">
      <motion.div
        className="ob-finish-badge"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
      >
        <PartyPopper size={42} />
      </motion.div>

      <h1>Setup Complete!</h1>
      <p className="ob-lead">
        You&apos;re all set, {form.name ? form.name.split(" ")[0] : "welcome"}.
        Your CyberShield experience is personalized and ready to go.
      </p>

      <button className="ob-btn-primary ob-btn-lg" onClick={handleFinish} disabled={saving}>
        {saving ? (
          <>
            <Loader2 size={18} className="ob-spin" /> Saving…
          </>
        ) : (
          <>
            Go to Dashboard <ArrowRight size={18} />
          </>
        )}
      </button>
    </div>
  );
}
