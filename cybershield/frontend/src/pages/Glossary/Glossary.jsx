import { useState, useCallback } from "react";
import GlossaryHome from "./GlossaryHome";
import GlossaryDetails from "./GlossaryDetails";
import Flashcards from "./Flashcards";
import Favorites from "./Favorites";

/**
 * Glossary (Module 7.3) — orchestrator.
 * Switches between Home, Details, Flashcards, and Favorites views.
 */
export default function Glossary() {
  const [view, setView] = useState("home"); // home | details | flashcards | favorites
  const [termId, setTermId] = useState(null);

  const refreshProgress = useCallback(() => {
    // progress is pulled fresh whenever a child mounts; nothing global needed
  }, []);

  const openTerm = (id) => {
    setTermId(id);
    setView("details");
    window.scrollTo(0, 0);
  };

  if (view === "details" && termId) {
    return (
      <GlossaryDetails
        termId={termId}
        onOpen={openTerm}
        onBack={() => setView("home")}
        onRefreshProgress={refreshProgress}
      />
    );
  }

  if (view === "flashcards") {
    return <Flashcards onBack={() => setView("home")} onRefreshProgress={refreshProgress} />;
  }

  if (view === "favorites") {
    return (
      <Favorites onOpen={openTerm} onBack={() => setView("home")} />
    );
  }

  return (
    <GlossaryHome onOpen={openTerm} />
  );
}
