import { motion } from "framer-motion";

/**
 * Module E4, Step 9 — Security Score Card.
 * Shows current score, previous score, and improvement percentage.
 */
export default function SecurityScoreCard({ security }) {
  const current = security?.current_score ?? 82;
  const previous = security?.previous_score ?? 72;
  const improvement = security?.improvement ?? (current - previous);

  const scoreColor =
    current >= 80 ? "text-green-600" : current >= 60 ? "text-yellow-600" : "text-red-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
    >
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Security Improvement
      </h2>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-3xl font-bold text-gray-900">{current}</p>
          <p className="text-xs text-gray-400 mt-1">Current Score</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-400">{previous}</p>
          <p className="text-xs text-gray-400 mt-1">Previous Score</p>
        </div>
        <div>
          <p className={`text-3xl font-bold ${improvement >= 0 ? "text-green-600" : "text-red-600"}`}>
            {improvement >= 0 ? "+" : ""}{improvement}%
          </p>
          <p className="text-xs text-gray-400 mt-1">Improvement</p>
        </div>
      </div>
      {/* Score bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${
              current >= 80 ? "bg-green-500" : current >= 60 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{ width: `${Math.min(current, 100)}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
