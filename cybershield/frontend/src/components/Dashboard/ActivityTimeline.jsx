import { motion } from "framer-motion";

/**
 * Module E4, Step 13 — Activity Timeline Card.
 * Shows user's recent activity timestamps.
 */
export default function ActivityTimeline({ activity }) {
  if (!activity) return null;

  const items = [
    { label: "Last Scan", value: activity.last_scan, icon: "🔍", color: "text-blue-500" },
    { label: "Last Quiz", value: activity.last_quiz, icon: "📝", color: "text-purple-500" },
    { label: "Last AI Chat", value: activity.last_ai_chat, icon: "🤖", color: "text-green-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
    >
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Activity
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={item.color}>{item.icon}</span>
              <span className="text-sm text-gray-600">{item.label}:</span>
            </div>
            <span className="text-sm font-medium text-gray-800">
              {item.value || "No activity yet"}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
