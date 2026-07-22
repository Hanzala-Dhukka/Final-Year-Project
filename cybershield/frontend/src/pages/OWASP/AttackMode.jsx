import { useState } from "react";
import owaspApi, { OWASP_DIFFICULTIES } from "../../api/owaspApi";
import ScenarioCard from "../../components/OWASP/ScenarioCard";
import HintPanel from "../../components/OWASP/HintPanel";
import PayloadEditor from "../../components/OWASP/PayloadEditor";
import AIExplanation from "../../components/OWASP/AIExplanation";

/**
 * Attack Mode (spec Step 15). Pick a vulnerability + difficulty, start a
 * session, submit payloads, use hints, and receive AI coach feedback.
 */
export default function AttackMode({ initialLab, onBack, onComplete }) {
  const [vuln, setVuln] = useState(initialLab || "SQL Injection");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [sim, setSim] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    setResult(null);
    setHintsUsed(0);
    try {
      const r = await owaspApi.start({ vulnerability: vuln, mode: "attack", difficulty });
      setSim(r.data);
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to start simulation");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (payload) => {
    setLoading(true);
    try {
      const r = await owaspApi.attack({ session_id: sim.session_id, payload, hints_used: hintsUsed });
      setResult(r.data);
      if (r.data.success && onComplete) onComplete();
    } catch (e) {
      alert(e.response?.data?.detail || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 mb-4">← Back</button>

      {!sim ? (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">⚔️ Attack Mode</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Vulnerability</label>
            <input
              value={vuln}
              onChange={(e) => setVuln(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Difficulty</label>
            <div className="flex gap-2">
              {OWASP_DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    difficulty === d ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={start}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Start Simulation"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <ScenarioCard simulation={sim} />
          <HintPanel hints={sim.hints} onHint={(n) => setHintsUsed(n)} />
          {!result && <PayloadEditor onSubmit={submit} disabled={loading} />}
          {result && (
            <div className="space-y-4">
              <div className={`rounded-lg p-4 text-center font-semibold ${
                result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
              }`}>
                {result.success ? "✅ Attack Successful" : "❌ Not triggered"} · +{result.xp_earned} XP
                {result.no_hint_bonus && <span className="block text-xs">No-hint bonus! +20 XP</span>}
              </div>
              <AIExplanation
                explanation={result.coach}
                provider={result.provider}
                owasp={result.owasp}
                businessImpact={result.business_impact}
                fix={result.fix}
              />
              <button
                onClick={() => { setSim(null); setResult(null); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Try Another
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
