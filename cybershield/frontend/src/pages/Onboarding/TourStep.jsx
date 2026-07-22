import { useState } from "react";
import { ArrowRight, ArrowLeft, SkipForward, LayoutDashboard, Radar, FileBarChart, BrainCircuit, User, PanelLeft } from "lucide-react";

// Feature tour slides (Sidebar, Dashboard, Scanner, Reports, AI Assistant, Profile).
// Implemented without react-joyride so it works on React 19 and offline.
const SLIDES = [
  {
    icon: PanelLeft,
    title: "Sidebar Navigation",
    desc: "Jump between your labs, scans, reports, and tools from the always-available left sidebar.",
    accent: "#6366f1",
  },
  {
    icon: LayoutDashboard,
    title: "Your Dashboard",
    desc: "A live overview of your security posture, progress, and upcoming challenges.",
    accent: "#22d3ee",
  },
  {
    icon: Radar,
    title: "Security Scanner",
    desc: "Run SAST and dependency scans against your repos to catch vulnerabilities early.",
    accent: "#f59e0b",
  },
  {
    icon: FileBarChart,
    title: "Threat Reports",
    desc: "Generate audit-ready reports and share findings with your team.",
    accent: "#10b981",
  },
  {
    icon: BrainCircuit,
    title: "AI Security Assistant",
    desc: "Ask questions, get threat models, and speed up remediation with the AI copilot.",
    accent: "#a855f7",
  },
  {
    icon: User,
    title: "Your Profile",
    desc: "Track achievements, manage settings, and showcase your cybersecurity skills.",
    accent: "#ef4444",
  },
];

export default function TourStep({ next }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const Icon = slide.icon;
  const isLast = index === SLIDES.length - 1;
  const progress = Math.round(((index + 1) / SLIDES.length) * 100);

  const advance = () => {
    if (isLast) next();
    else setIndex((i) => i + 1);
  };

  return (
    <div className="ob-step ob-tour">
      <h2>Quick tour of CyberShield</h2>
      <p className="ob-step-sub">
        Here are the key areas you&apos;ll use. You can explore them anytime later.
      </p>

      <div className="ob-tour-stage" style={{ "--accent": slide.accent }}>
        {/* Spotlight visualization */}
        <div className="ob-tour-spotlight">
          <div className="ob-tour-ring" />
          <div className="ob-tour-icon">
            <Icon size={40} />
          </div>
        </div>
        <div className="ob-tour-info">
          <h3>{slide.title}</h3>
          <p>{slide.desc}</p>
        </div>
      </div>

      {/* Progress + controls (continuous, showProgress, showSkipButton) */}
      <div className="ob-tour-progress">
        <div className="ob-tour-track">
          <div
            className="ob-tour-fill"
            style={{ width: `${progress}%`, background: slide.accent }}
          />
        </div>
        <span className="ob-tour-count">
          {index + 1} / {SLIDES.length}
        </span>
      </div>

      <div className="ob-actions">
        <button className="ob-btn-ghost" onClick={next}>
          <SkipForward size={16} /> Skip tour
        </button>
        <button className="ob-btn-primary" onClick={advance}>
          {isLast ? "Finish tour" : "Next"} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
