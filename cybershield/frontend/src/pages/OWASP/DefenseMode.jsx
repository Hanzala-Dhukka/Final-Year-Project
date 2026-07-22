import { useState } from "react";
import owaspApi, { OWASP_DIFFICULTIES } from "../../api/owaspApi";
import ScenarioCard from "../../components/OWASP/ScenarioCard";
import HintPanel from "../../components/OWASP/HintPanel";
import CodeEditor from "../../components/OWASP/CodeEditor";
import AIExplanation from "../../components/OWASP/AIExplanation";

/**
 * Defense Mode (spec Step 16). Start a defense session, edit the vulnerable
 * code, submit for AI review + validation, receive score + feedback.
 */
export default function DefenseMode({ initialLab, onBack, onComplete }) {
  const [vuln, setVuln] = useState(initialLab || "SQL Injection");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [sim, setSim] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    setResult(null);
    setHintsUsed(0);
    setCode("");
    try {
      const r = await owaspApi.start({ vulnerability: vuln, mode: "defense", difficulty });
      setSim(r.data);
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to start simulation");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      const r = await owaspApi.defense({ session_id: sim.session_id, user_code: code, hints_used: hintsUsed });
      setResult(r.data);
      if (r.data.status === "Passed" && onComplete) onComplete();
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
          <h2 className="text-xl font-semibold text-gray-800">🛡️ Defense Mode</h2>
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
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Start Lab"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <ScenarioCard simulation={sim} />
          <HintPanel hints={sim.hints} onHint={(n) => setHintsUsed(n)} />
          {!result ? (
            <CodeEditor value={code} onChange={setCode} onSubmit={submit} disabled={loading} />
          ) : (
            <div className="space-y-4">
              <div className={`rounded-lg p-4 text-center font-semibold ${
                result.status === "Passed"
                  ? "bg-green-50 text-green-700"
                  : result.status === "Partial"
                  ? "bg-yellow-50 text-yellow-700"
                  : "bg-red-50 text-red-600"
              }`}>
                {result.status} · Score {result.score} · +{result.xp_earned} XP
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-sm text-gray-700 whitespace-pre-line">
                {result.feedback}
                {result.recommendation && (
                  <p className="mt-2 text-gray-600"><strong>Recommendation:</strong> {result.recommendation}</p>
                )}
              </div>
              <AIExplanation explanation={result.coach} owasp={result.owasp_reference} />
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
