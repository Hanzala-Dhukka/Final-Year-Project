import { useState, useCallback } from "react";
import { Swords, Sun, Moon, BadgeCheck } from "lucide-react";
import { useTheme } from "../../theme/useTheme";
import Home from "./Home";
import AttackMode from "./AttackMode";
import DefenseMode from "./DefenseMode";
import DailyChallenge from "./DailyChallenge";
import Progress from "./Progress";
import "./OWASP.css";

/**
 * OWASP Learning Center (Module 7.4) — top-level orchestrator.
 * Switches between Home, Attack, Defense, Daily Challenge, and Progress views
 * with a shared professional header + theme toggle.
 */
export default function OWASP() {
  const [view, setView] = useState("home"); // home | attack | defense | daily | progress
  const [lab, setLab] = useState(null);
  const { isDark, toggleTheme } = useTheme();

  const goHome = useCallback(() => {
    setLab(null);
    setView("home");
    window.scrollTo(0, 0);
  }, []);

  const goAttack = useCallback((initialLab) => {
    setLab(initialLab || null);
    setView("attack");
    window.scrollTo(0, 0);
  }, []);

  const goDefense = useCallback((initialLab) => {
    setLab(initialLab || null);
    setView("defense");
    window.scrollTo(0, 0);
  }, []);

  const goDaily = useCallback(() => {
    setView("daily");
    window.scrollTo(0, 0);
  }, []);

  const goProgress = useCallback(() => {
    setView("progress");
    window.scrollTo(0, 0);
  }, []);

  const viewProps = {
    onBack: goHome,
    onAttack: goAttack,
    onDefense: goDefense,
    onDaily: goDaily,
    onProgress: goProgress,
    onLab: goAttack,
  };

  return (
    <div className="cs-ow-wrap">
      <header className="cs-ow-header">
        <div className="cs-ow-brand">
          <div className="cs-ow-logo">
            <Swords size={23} />
          </div>
          <div>
            <h1>
              OWASP <span className="cs-ow-grad">Learning Center</span>
            </h1>
            <p className="subtitle">Attack, defend & master the Top 10</p>
          </div>
        </div>

        <div className="cs-ow-header-spacer" />

        <span className="cs-ow-badge">
          <BadgeCheck size={13} />
          Hands-on Labs
        </span>

        <button
          className="cs-ow-icon-btn"
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {view === "attack" ? (
        <AttackMode {...viewProps} initialLab={lab} />
      ) : view === "defense" ? (
        <DefenseMode {...viewProps} initialLab={lab} />
      ) : view === "daily" ? (
        <DailyChallenge {...viewProps} />
      ) : view === "progress" ? (
        <Progress {...viewProps} />
      ) : (
        <Home {...viewProps} />
      )}
    </div>
  );
}