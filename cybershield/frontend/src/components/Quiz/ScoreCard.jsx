/**
 * Result summary card (spec Step 15): score, percentage, XP, rank.
 */
export default function ScoreCard({ score, total, percentage, xp, rank }) {
  const ringColor =
    percentage >= 80 ? "text-green-500" : percentage >= 50 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="bg-white rounded-lg shadow p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
      <div>
        <div className="text-3xl font-bold text-gray-800">
          {score}/{total}
        </div>
        <p className="text-gray-500 text-sm mt-1">Score</p>
      </div>
      <div>
        <div className={`text-3xl font-bold ${ringColor}`}>{percentage}%</div>
        <p className="text-gray-500 text-sm mt-1">Accuracy</p>
      </div>
      <div>
        <div className="text-3xl font-bold text-indigo-600">+{xp}</div>
        <p className="text-gray-500 text-sm mt-1">XP Earned</p>
      </div>
      <div>
        <div className="text-3xl font-bold text-purple-600">#{rank || "—"}</div>
        <p className="text-gray-500 text-sm mt-1">Rank</p>
      </div>
    </div>
  );
}
