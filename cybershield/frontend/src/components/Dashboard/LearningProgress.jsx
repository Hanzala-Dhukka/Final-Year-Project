import { motion } from "framer-motion";

/**
 * Module E4, Step 10 — Learning Progress Card.
 * Displays progress across OWASP modules, quizzes, and AI recommendations.
 */
export default function LearningProgress({ progress }) {
  if (!progress) return null;

  const items = [
    {
      label: "OWASP Modules",
      completed: progress.owasp_completed || 0,
      total: progress.owasp_total || 10,
      color: "bg-blue-500",
    },
    {
      label: "Quizzes Completed",
      completed: progress.quiz_completed || 0,
      total: progress.quiz_total || 30,
      color: "bg-purple-500",
    },
    {
      label: "AI Recommendations",
      completed: progress.recommendations_completed || 0,
      total: progress.recommendations_total || 15,
      color: "bg-green-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
    >
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Learning Progress
      </h2>
      <div className="space-y-4">
        {items.map((item) => {
          const pct = Math.round((item.completed / Math.max(item.total, 1)) * 100);
          return (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{item.label}</span>
                <span className="text-gray-500">
                  {item.completed} / {item.total}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`${item.color} h-2.5 rounded-full transition-all duration-700`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
