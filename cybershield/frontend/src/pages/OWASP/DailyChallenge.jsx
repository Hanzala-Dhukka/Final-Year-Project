import { useState, useEffect } from "react";
import owaspApi from "../../api/owaspApi";
import AttackMode from "./AttackMode";

/**
 * Daily Challenge (spec Step 9). Shows today's challenge with a countdown; once
 * completed the reward is granted only once. On "Start", opens AttackMode for
 * the challenge's vulnerability.
 */
export default function DailyChallenge({ onBack }) {
  const [challenge, setChallenge] = useState(null);
  const [launch, setLaunch] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => {
    owaspApi
      .daily()
      .then((r) => setChallenge(r.data))
      .catch(() => setChallenge(null));
  };

  useEffect(() => {
    load();
  }, []);

  const complete = async () => {
    try {
      const r = await owaspApi.completeDaily();
      const xp = r.data.xp_awarded;
      setMsg(xp > 0 ? `🎉 Daily challenge complete! +${xp} XP` : "Already completed today.");
      load();
    } catch (e) {
      setMsg("Failed to complete challenge.");
    }
  };

  if (launch && challenge) {
    return (
      <AttackMode
        initialLab={challenge.vulnerability}
        onBack={() => setLaunch(false)}
        onComplete={complete}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 mb-4">← Back</button>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">📅 Daily Challenge</h1>

      {!challenge ? (
        <p className="text-gray-400">Loading today's challenge…</p>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-xs text-gray-400 mb-1">Today's Challenge</div>
          <h2 className="text-xl font-semibold text-gray-800">{challenge.vulnerability}</h2>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500">{challenge.difficulty}</span>
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">Reward: {challenge.reward_xp} XP</span>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Expires: {new Date(challenge.expires_at).toLocaleString()}
          </p>
          {challenge.completed && (
            <p className="text-green-600 text-sm mt-2">✅ Completed today</p>
          )}
          <button
            onClick={() => setLaunch(true)}
            className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Start Challenge
          </button>
        </div>
      )}

      {msg && <p className="mt-4 text-center text-green-600 font-semibold">{msg}</p>}
    </div>
  );
}
