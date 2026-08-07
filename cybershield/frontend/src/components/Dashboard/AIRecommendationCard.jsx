import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const TYPE_COLORS = {
  OWASP: "bg-blue-50 text-blue-700",
  Glossary: "bg-purple-50 text-purple-700",
  Quiz: "bg-orange-50 text-orange-700",
  Learning: "bg-green-50 text-green-700",
};

/**
 * Module E4, Step 12 — AI Recommendation Card.
 * Shows recommended learning topics from AI analysis.
 */
export default function AIRecommendationCard({ items }) {
  if (!items || items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-gray-200 p-5"
      >
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          AI Recommended Learning
        </h2>
        <p className="text-sm text-gray-400">Complete a scan to get personalized recommendations.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
    >
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        AI Recommended Learning
      </h2>
      <div className="space-y-2">
        {items.map((item, i) => {
          const colorClass = TYPE_COLORS[item.type] || "bg-gray-50 text-gray-700";
          return (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-sm">✓</span>
                <span className="text-sm font-medium text-gray-800">{item.topic}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
                {item.type}
              </span>
            </div>
          );
        })}
      </div>
      <Link
        to="/learning-goals"
        className="block mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium text-center"
      >
        View All Recommendations →
      </Link>
    </motion.div>
  );
}
