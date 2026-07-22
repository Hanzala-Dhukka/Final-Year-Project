import { useState, useEffect } from "react";
import owaspApi from "../../api/owaspApi";
import ProgressBar from "../../components/OWASP/ProgressBar";

/**
 * Progress page (spec Step 12/17). Shows XP, level, completed labs, badges, and
 * recent practice history.
 */
export default function Progress({ onBack }) {
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    owaspApi
      .progress()
      .then((r) => setProgress(r.data))
      .catch(() => setProgress(null));
    owaspApi
      .history()
      .then((r) => setHistory(r.data))
      .catch(() => setHistory([]));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 mb-4">← Back</button>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">📈 My Progress</h1>

      {!progress ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{progress.xp}</div>
              <div className="text-xs text-gray-500">XP</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">Lv {progress.level}</div>
              <div className="text-xs text-gray-500">Level</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{progress.completed_attack.length + progress.completed_defense.length}</div>
              <div className="text-xs text-gray-500">Labs Done</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">{progress.badges.length}</div>
              <div className="text-xs text-gray-500">Badges</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-semibold text-gray-800 mb-2">Completed Attack Labs</h3>
            {progress.completed_attack.length ? (
              <div className="flex flex-wrap gap-2">
                {progress.completed_attack.map((c) => (
                  <span key={c} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600">{c}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">None yet.</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-semibold text-gray-800 mb-2">Completed Defense Labs</h3>
            {progress.completed_defense.length ? (
              <div className="flex flex-wrap gap-2">
                {progress.completed_defense.map((c) => (
                  <span key={c} className="text-xs px-2 py-1 rounded bg-green-50 text-green-600">{c}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">None yet.</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Recent Practice</h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400">No attempts yet.</p>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 10).map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-1">
                    <span className="text-gray-700">
                      <span className={h.mode === "attack" ? "text-red-500" : "text-green-600"}>
                        {h.mode === "attack" ? "⚔️" : "🛡️"}
                      </span>{" "}
                      {h.vulnerability}
                    </span>
                    <span className="text-gray-400">
                      {h.success ? "✅" : "❌"} +{h.xp_earned} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
