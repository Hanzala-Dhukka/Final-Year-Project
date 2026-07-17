/**
 * Risk reduction prediction widget (spec Step 12).
 * Shows the before/after risk score and the delta.
 */
function colorFor(score) {
  if (score >= 75) return "text-red-600";
  if (score >= 50) return "text-orange-500";
  if (score >= 25) return "text-yellow-500";
  return "text-green-600";
}

export default function RiskReduction({ before, after }) {
  if (before == null && after == null) {
    return <p className="text-sm text-gray-400">Risk estimate unavailable.</p>;
  }
  const b = before ?? 0;
  const a = after ?? 0;
  const delta = b - a;

  return (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <p className="text-xs text-gray-500">Before</p>
        <p className={`text-2xl font-bold ${colorFor(b)}`}>{b}</p>
      </div>
      <div className="text-green-600 text-2xl font-bold">↓ {delta}</div>
      <div className="text-center">
        <p className="text-xs text-gray-500">After</p>
        <p className={`text-2xl font-bold ${colorFor(a)}`}>{a}</p>
      </div>
      <p className="text-xs text-gray-400 ml-2">
        Risk Reduction<br />↓ {delta} points
      </p>
    </div>
  );
}
