/**
 * Security score gauge + risk level badge (spec Step 6, Step 10).
 */
function colorFor(score) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-600";
}

const RISK_COLORS = {
  Low: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

export default function SecurityScore({ score = 0, risk = "Unknown" }) {
  return (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <p className="text-xs text-gray-500">Security Score</p>
        <p className={`text-4xl font-extrabold ${colorFor(score)}`}>{score}</p>
        <p className="text-xs text-gray-400">/ 100</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-500">Risk Level</p>
        <span
          className={`inline-block mt-1 px-3 py-1 rounded font-bold ${
            RISK_COLORS[risk] || "bg-gray-100 text-gray-600"
          }`}
        >
          {risk.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
