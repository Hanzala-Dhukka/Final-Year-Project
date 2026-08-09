import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Swords,
  Shield,
  CalendarClock,
  TrendingUp,
  Sparkles,
  BookOpen,
} from "lucide-react";
import owaspApi from "../../api/owaspApi";

const DIFF_CHIP = {
  Beginner: "cs-ow-chip--easy",
  Easy: "cs-ow-chip--easy",
  Intermediate: "cs-ow-chip--medium",
  Medium: "cs-ow-chip--medium",
  Advanced: "cs-ow-chip--hard",
  Hard: "cs-ow-chip--hard",
  Expert: "cs-ow-chip--danger",
};

function diffChipClass(d) {
  return DIFF_CHIP[d] || "cs-ow-chip--neutral";
}

/**
 * OWASP Learning Center home. Hero + mode tiles + guided labs list.
 */
export default function Home({ onAttack, onDefense, onDaily, onProgress, onLab }) {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    owaspApi
      .labs()
      .then((r) => {
        if (mounted) setLabs(r.data.labs || []);
      })
      .catch(() => {
        if (mounted) setError("Could not load labs. Is the backend running?");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleAskAI = () => {
    const owaspContext = {
      type: "owasp",
      scanData: { vulnerability: "General OWASP", source: "owasp_home" },
    };
    sessionStorage.setItem("aiAssistantContext", JSON.stringify(owaspContext));
    navigate("/ai-assistant");
  };

  const tiles = [
    {
      key: "attack",
      title: "Attack Mode",
      desc: "Exploit vulnerable apps in a safe sandbox",
      icon: Swords,
      cls: "cs-ow-tile--attack",
      onClick: onAttack,
    },
    {
      key: "defense",
      title: "Defense Mode",
      desc: "Rewrite vulnerable code into secure solutions",
      icon: Shield,
      cls: "cs-ow-tile--defense",
      onClick: onDefense,
    },
    {
      key: "daily",
      title: "Daily Challenge",
      desc: "One curated lab a day • 100 XP",
      icon: CalendarClock,
      cls: "cs-ow-tile--daily",
      onClick: onDaily,
    },
    {
      key: "progress",
      title: "My Progress",
      desc: "Track XP, level, badges & history",
      icon: TrendingUp,
      cls: "cs-ow-tile--progress",
      onClick: onProgress,
    },
  ];

  return (
    <div className="cs-ow-wrap">
      <section className="cs-ow-hero">
        <div className="cs-ow-hero-main">
          <span className="cs-ow-hero-eyebrow">
            <Sparkles size={13} /> OWASP Top 10 • Practical Labs
          </span>
          <h2>Hack it. Fix it. Master it.</h2>
          <p>
            Launch attack and defense simulations for the OWASP Top 10, guided by
            an AI coach. Earn XP, level up, and turn vulnerabilities into hardened
            code — all inside a safe, simulated environment.
          </p>
        </div>
        <div className="cs-ow-hero-stats">
          <div className="cs-ow-stat">
            <b>{labs.length || "—"}</b>
            <span>Labs</span>
          </div>
          <div className="cs-ow-stat">
            <b>2</b>
            <span>Modes</span>
          </div>
          <div className="cs-ow-stat">
            <b>AI</b>
            <span>Coach</span>
          </div>
        </div>
      </section>

      <div className="cs-ow-section-title">
        <h3>Training Modes</h3>
        <p>Choose how you want to practice</p>
      </div>
      <div className="cs-ow-tiles">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} className={`cs-ow-tile ${t.cls}`} onClick={t.onClick}>
              <span className="cs-ow-tile-icon">
                <Icon size={19} />
              </span>
              <h4>{t.title}</h4>
              <p>{t.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="cs-ow-section-title">
        <h3>Guided Labs</h3>
        <p>Pick a vulnerability to launch its attack lab</p>
      </div>

      {loading && (
        <div className="cs-ow-loading">
          <span className="cs-ow-spin" /> Loading labs…
        </div>
      )}

      {error && <div className="cs-ow-alert cs-ow-alert--error">{error}</div>}

      {!loading && !error && labs.length === 0 && (
        <div className="cs-ow-empty">
          <BookOpen size={20} style={{ marginBottom: 6 }} />
          <br />No labs available right now.
        </div>
      )}

      {labs.length > 0 && (
        <div className="cs-ow-labs">
          {labs.map((lab) => (
            <button key={lab.name} className="cs-ow-lab" onClick={() => onLab && onLab(lab.name)}>
              <div className="cs-ow-lab-top">
                <span className="cs-ow-lab-name">{lab.name}</span>
                <span className={`cs-ow-chip ${diffChipClass(lab.difficulty)}`}>
                  {lab.difficulty}
                </span>
              </div>
              <p>{lab.scenario}</p>
              <div className="cs-ow-lab-meta">
                <span className="cs-ow-chip cs-ow-chip--info">
                  <Shield size={11} /> {lab.owasp || "OWASP"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}