import { useState } from "react";
import Home from "./Home";
import AttackMode from "./AttackMode";
import DefenseMode from "./DefenseMode";
import DailyChallenge from "./DailyChallenge";
import Progress from "./Progress";

/**
 * OWASP Simulator (Module 7.4) — orchestrator.
 * Switches between Home, Attack, Defense, Daily Challenge, and Progress views.
 */
export default function OWASP() {
  const [view, setView] = useState("home"); // home | attack | defense | daily | progress
  const [lab, setLab] = useState(null);

  const back = () => {
    setView("home");
    setLab(null);
  };

  if (view === "attack") {
    return (
      <AttackMode
        initialLab={lab}
        onBack={back}
        onComplete={() => { /* progress auto-updates server-side */ }}
      />
    );
  }
  if (view === "defense") {
    return (
      <DefenseMode
        initialLab={lab}
        onBack={back}
        onComplete={() => {}}
      />
    );
  }
  if (view === "daily") {
    return <DailyChallenge onBack={back} />;
  }
  if (view === "progress") {
    return <Progress onBack={back} />;
  }

  return (
    <Home
      onAttack={() => { setLab(null); setView("attack"); }}
      onDefense={() => { setLab(null); setView("defense"); }}
      onDaily={() => setView("daily")}
      onProgress={() => setView("progress")}
      onLab={(name) => { setLab(name); setView("attack"); }}
    />
  );
}
