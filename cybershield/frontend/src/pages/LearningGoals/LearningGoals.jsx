import { useState, useEffect } from "react";
import gamificationApi from "../../api/gamificationApi";

/**
 * Learning Goals (spec Step 17). Users set goals that are tracked automatically
 * from their activity (quizzes / glossary terms / OWASP labs per day|week).
 */
const GOAL_TYPES = [
  { value: "quizzes", label: "Quizzes" },
  { value: "glossary_terms", label: "Glossary Terms" },
  { value: "owasp_labs", label: "OWASP Labs" },
];

export default function LearningGoals({ onBack }) {
  const [goals, setGoals] = useState([]);
  const [goalType, setGoalType] = useState("quizzes");
  const [target, setTarget] = useState(5);
  const [period, setPeriod] = useState("weekly");
  const [loading, setLoading] = useState(true);

  const load = () => {
    gamificationApi
      .goals()
      .then((r) => setGoals(r.data))
      .catch(() => setGoals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    try {
      await gamificationApi.createGoal({ goal_type: goalType, target: Number(target), period });
      setTarget(5);
      load();
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to create goal");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {onBack && (
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 mb-4">
          ← Back
        </button>
      )}
      <h1 className="text-3xl font-bold text-gray-900 mb-1">🎯 Learning Goals</h1>
      <p className="text-gray-500 mb-6">Set targets and track them automatically.</p>

      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Goal</label>
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {GOAL_TYPES.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Target</label>
            <input
              type="number"
              min={1}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="daily">Per day</option>
              <option value="weekly">Per week</option>
            </select>
          </div>
          <button
            onClick={add}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Add Goal
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : goals.length === 0 ? (
        <p className="text-gray-400">No goals yet. Add one above.</p>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const label = GOAL_TYPES.find((t) => t.value === g.goal_type)?.label || g.goal_type;
            const pct = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0;
            return (
              <div key={g.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">
                    {g.target} {label} / {g.period}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${g.completed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {g.completed ? "✅ Done" : `${g.current}/${g.target}`}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
