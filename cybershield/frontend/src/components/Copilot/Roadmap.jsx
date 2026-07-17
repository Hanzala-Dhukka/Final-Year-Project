/**
 * Security improvement roadmap grouped by week (spec Step 8, Step 10).
 */
export default function Roadmap({ weeks = [] }) {
  if (!weeks || weeks.length === 0) {
    return <p className="text-sm text-gray-400">No roadmap generated yet.</p>;
  }
  return (
    <div className="space-y-3">
      {weeks.map((w, i) => (
        <div key={i} className="border-l-4 border-blue-500 pl-3">
          <p className="font-semibold text-gray-800">{w.week}</p>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {(w.tasks || []).map((t, j) => (
              <li key={j}>{t}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
