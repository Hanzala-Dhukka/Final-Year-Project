import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X } from "lucide-react";
import { useToast } from "../../components/Animation/ToastProvider";
import { getOnboardingStatus, skipOnboarding } from "../../services/onboardingService";
import Welcome from "./Welcome";
import ProfileStep from "./ProfileStep";
import SkillStep from "./SkillStep";
import GoalStep from "./GoalStep";
import TourStep from "./TourStep";
import FinishStep from "./FinishStep";
import "./onboarding.css";

const STEPS = [
  { key: "welcome", label: "Welcome" },
  { key: "profile", label: "Profile" },
  { key: "skill", label: "Skill" },
  { key: "goals", label: "Goals" },
  { key: "tour", label: "Tour" },
  { key: "finish", label: "Finish" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  // Collected onboarding data, shared across steps.
  const [form, setForm] = useState({
    name: "",
    avatar: "",
    bio: "",
    skill_level: "",
    learning_goals: [],
  });

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  // Guard: only first-time users should see this. If already onboarded or
  // not authenticated, send them where they belong.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const status = await getOnboardingStatus();
        if (!mounted) return;
        if (!status.first_login) {
          navigate("/dashboard", { replace: true });
          return;
        }
        // Pre-fill any existing values (e.g. name from registration).
        setForm((f) => ({
          ...f,
          name: status.name || f.name,
          avatar: status.avatar || f.avatar,
          bio: status.bio || f.bio,
        }));
      } catch (err) {
        if (!mounted) return;
        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        toast.error("Could not load onboarding. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate, toast]);

  const handleSkip = async () => {
    if (checking) return;
    setChecking(true);
    try {
      await skipOnboarding();
      toast.success("Onboarding skipped — welcome to CyberShield!");
      navigate("/dashboard", { replace: true });
    } catch {
      toast.error("Could not skip onboarding. Please try again.");
      setChecking(false);
    }
  };

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  if (loading) {
    return (
      <div className="ob-page">
        <div className="ob-loading">Loading your setup…</div>
      </div>
    );
  }

  const pages = [
    <Welcome key="welcome" next={() => setStep(1)} />,
    <ProfileStep key="profile" form={form} update={update} next={() => setStep(2)} />,
    <SkillStep key="skill" form={form} update={update} next={() => setStep(3)} />,
    <GoalStep key="goals" form={form} update={update} next={() => setStep(4)} />,
    <TourStep key="tour" next={() => setStep(5)} />,
    <FinishStep key="finish" form={form} navigate={navigate} toast={toast} />,
  ];

  return (
    <div className="ob-page">
      <div className="ob-card">
        {/* Header: brand + skip */}
        <div className="ob-header">
          <div className="ob-brand">
            <Shield size={20} className="ob-brand-icon" />
            <span>CyberShield</span>
          </div>
          <button
            className="ob-skip"
            onClick={handleSkip}
            disabled={checking}
            title="Skip onboarding"
          >
            <X size={14} /> Skip setup
          </button>
        </div>

        {/* Progress indicator */}
        <div className="ob-progress">
          <div className="ob-progress-track">
            <motion.div
              className="ob-progress-fill"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
          <div className="ob-steps">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={
                  "ob-step-dot" +
                  (i === step ? " active" : "") +
                  (i < step ? " done" : "")
                }
              >
                <span className="ob-step-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="ob-progress-pct">{progress}%</div>
        </div>

        {/* Step content */}
        <div className="ob-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
            >
              {pages[step]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
