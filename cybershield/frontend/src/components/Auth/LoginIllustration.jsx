import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  GitBranch,
  BookOpen,
  BrainCircuit,
  FileBarChart,
  ShieldAlert,
  Activity,
} from "lucide-react";
import CyberShieldLogo from "./CyberShieldLogo";

const FEATURES = [
  {
    icon: GitBranch,
    title: "GitHub Security Scanner",
    desc: "Continuous SAST & dependency scanning on every push.",
  },
  {
    icon: BookOpen,
    title: "OWASP Training",
    desc: "Hands-on labs mapped to the OWASP Top 10.",
  },
  {
    icon: BrainCircuit,
    title: "AI Threat Modeling",
    desc: "Generate threat models from plain-English specs.",
  },
  {
    icon: FileBarChart,
    title: "Security Reports",
    desc: "Executive-ready dashboards and audit trails.",
  },
];

const SECURITY_TIPS = [
  "Use a password manager to generate unique credentials for every service.",
  "Enable MFA wherever possible — it blocks 99% of automated account attacks.",
  "Rotate secrets immediately if a repository is made public by accident.",
  "Treat every dependency as code: scan it before you ship it.",
  "Least privilege isn't optional — scope API tokens to what you actually need.",
];

// Mocked live stat that gently increments to feel "alive".
const MOCK_BASE = 1248;

export default function LoginIllustration() {
  const [stat, setStat] = useState(MOCK_BASE);
  const [tipIndex, setTipIndex] = useState(0);

  // Slowly tick the repo counter to simulate live activity.
  useEffect(() => {
    const id = setInterval(() => {
      setStat((s) => s + Math.floor(Math.random() * 3));
    }, 2600);
    return () => clearInterval(id);
  }, []);

  // Rotate the cybersecurity tip every several seconds.
  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % SECURITY_TIPS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="cs-brand">
      {/* Background grid with glowing nodes */}
      <div className="cs-brand-grid" aria-hidden="true" />
      <div className="cs-brand-glow cs-brand-glow--a" aria-hidden="true" />
      <div className="cs-brand-glow cs-brand-glow--b" aria-hidden="true" />

      {/* Floating shields (subtle) */}
      <motion.div
        className="cs-brand-float cs-brand-float--1"
        animate={{ y: [0, -16, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      >
        <ShieldCheck size={28} />
      </motion.div>
      <motion.div
        className="cs-brand-float cs-brand-float--2"
        animate={{ y: [0, 14, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      >
        <ShieldAlert size={22} />
      </motion.div>

      <div className="cs-brand-content">
        {/* Logo + wordmark */}
        <div className="cs-brand-head">
          <motion.div
            className="cs-brand-logo"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="cs-brand-logo-ring" aria-hidden="true" />
            <CyberShieldLogo size={56} light />
          </motion.div>
          <span className="cs-brand-wordmark">CyberShield</span>
        </div>

        <motion.h1
          className="cs-brand-title"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          Secure Your Code.
          <br />
          Protect Your Future.
        </motion.h1>
        <p className="cs-brand-subtitle">
          AI-powered DevSecOps platform for secure software development.
        </p>

        {/* Live stats ticker */}
        <div className="cs-brand-stats" role="status" aria-live="polite">
          <Activity size={16} className="cs-brand-stats-icon" />
          <span>
            <strong>{stat.toLocaleString()}</strong> repositories scanned
            today
          </span>
        </div>

        {/* Feature cards */}
        <div className="cs-brand-features">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                className="cs-feature-card"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.15 + i * 0.08 }}
              >
                <span className="cs-feature-icon">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="cs-feature-title">{f.title}</p>
                  <p className="cs-feature-desc">{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Rotating security tip */}
        <div className="cs-brand-tip" aria-live="polite">
          <span className="cs-brand-tip-badge">Tip</span>
          <AnimatedTip text={SECURITY_TIPS[tipIndex]} />
        </div>
      </div>
    </div>
  );
}

function AnimatedTip({ text }) {
  return (
    <motion.p
      key={text}
      className="cs-brand-tip-text"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {text}
    </motion.p>
  );
}
