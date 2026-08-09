import { useState, useCallback } from "react";
import { BookOpen, Grid3X3, Layers, Sun, Moon, Star, Sparkles } from "lucide-react";
import { useTheme } from "../../theme/useTheme";
import GlossaryHome from "./GlossaryHome";
import GlossaryDetails from "./GlossaryDetails";
import Flashcards from "./Flashcards";
import Favorites from "./Favorites";
import "./Glossary.css";

const TABS = [
  { id: "home", label: "Browse", icon: Layers },
  { id: "flashcards", label: "Flashcards", icon: BookOpen },
  { id: "favorites", label: "Favorites", icon: Star },
];

/**
 * Glossary (Module 7.3) — orchestrator.
 * Switches between Home, Details, Flashcards, and Favorites views with a
 * shared professional header + theme toggle.
 */
export default function Glossary() {
  const [view, setView] = useState("home"); // home | details | flashcards | favorites
  const [termId, setTermId] = useState(null);
  const { isDark, toggleTheme } = useTheme();

  const refreshProgress = useCallback(() => {
    // progress is pulled fresh whenever a child mounts; nothing global needed
  }, []);

  const openTerm = (id) => {
    setTermId(id);
    setView("details");
    window.scrollTo(0, 0);
  };

  const goTo = (id) => {
    setView(id);
    window.scrollTo(0, 0);
  };

  const activeTab = (["home", "flashcards", "favorites"].includes(view) ? view : null);

  return (
    <div className="cs-gs-wrap">
      <header className="cs-gs-header">
        <div className="cs-gs-brand">
          <div className="cs-gs-logo">
            <Sparkles size={24} />
          </div>
          <div>
            <h1>
              CyberShield <span className="cs-gs-grad">Glossary</span>
            </h1>
            <p className="subtitle">Browse, master and quiz hundreds of security terms</p>
          </div>
        </div>

        <div className="cs-gs-header-spacer" />

        <nav className="cs-gs-tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`cs-gs-tab ${activeTab === id ? "cs-gs-tab--active" : ""}`}
              onClick={() => goTo(id)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <button
          className="cs-gs-icon-btn"
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {view === "details" && termId ? (
        <GlossaryDetails
          termId={termId}
          onOpen={openTerm}
          onBack={() => goTo("home")}
          onRefreshProgress={refreshProgress}
        />
      ) : view === "flashcards" ? (
        <Flashcards onBack={() => goTo("home")} onRefreshProgress={refreshProgress} />
      ) : view === "favorites" ? (
        <Favorites onOpen={openTerm} onBack={() => goTo("home")} />
      ) : (
        <GlossaryHome onOpen={openTerm} />
      )}
    </div>
  );
}