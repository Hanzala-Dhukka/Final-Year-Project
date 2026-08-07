import { motion } from "framer-motion";

const LEVEL_STYLES = {
  Beginner: { bg: "bg-green-50", border: "border-green-300", text: "text-green-700", badge: "bg-green-100" },
  Intermediate: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", badge: "bg-blue-100" },
  Advanced: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700", badge: "bg-purple-100" },
  Expert: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700", badge: "bg-yellow-100" },
};

/**
 * Module E4 — User Level Card.
 * Displays the user's name and security level badge.
 */
export default function UserLevelCard({ user }) {
  const name = user?.name || "User";
  const level = user?.level || "Beginner";
  const styles = LEVEL_STYLES[level] || LEVEL_STYLES.Beginner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-5 ${styles.bg} ${styles.border}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Welcome Back, {name} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Your personalized security dashboard</p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${styles.badge} ${styles.text}`}>
          Security Level: {level}
        </span>
      </div>
    </motion.div>
  );
}
