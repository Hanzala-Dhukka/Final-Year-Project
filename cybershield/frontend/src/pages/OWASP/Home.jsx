import { useState, useEffect } from "react";
import owaspApi from "../../api/owaspApi";

/**
 * OWASP Learning Center home (spec Step 14). Entry points to all modes.
 */
export default function Home({ onAttack, onDefense, onDaily, onProgress, onLab }) {
  const [labs, setLabs] = useState([]);

  useEffect(() => {
    owaspApi
      .labs()
      .then((r) => setLabs(r.data.labs || []))
      .catch(() => setLabs([]));
  }, []);

  const tiles = [
    { key: "attack", title: "⚔️ Attack Mode", desc: "Exploit vulnerable apps safely", onClick: onAttack },
    { key: "defense", title: "🛡️ Defense Mode", desc: "Fix vulnerable code", onClick: onDefense },
    { key: "daily", title: "📅 Daily Challenge", desc: "One lab per day • 100 XP", onClick: onDaily },
    { key: "progress", title: "📈 My Progress", desc: "XP, level & badges", onClick: onProgress },
  ];

  const selectLab = (lab) => {
    // Open the lab in attack mode by default
    onLab && onLab(lab.name);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">🛡️ OWASP Learning Center</h1>
      <p className="text-gray-500 mb-6">
        Hands-on, safe cybersecurity training — attack, defend, and learn with AI.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {tiles.map((t) => (
          <button
            key={t.key}
            onClick={t.onClick}
            className="bg-white rounded-lg shadow p-5 text-left hover:shadow-md transition border border-transparent hover:border-blue-200"
          >
            <div className="text-lg font-semibold text-gray-800">{t.title}</div>
            <div className="text-sm text-gray-500 mt-1">{t.desc}</div>
          </button>
        ))}
      </div>

      <h2 className="text-xl font-semibold text-gray-800 mb-3">Guided Labs</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {labs.map((lab) => (
          <button
            key={lab.name}
            onClick={() => selectLab(lab)}
            className="bg-white rounded-lg shadow p-4 text-left hover:shadow-md transition"
          >
            <div className="font-medium text-gray-800">{lab.name}</div>
            <div className="text-xs text-gray-400 mt-1">
              {lab.title} • {lab.difficulty}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
