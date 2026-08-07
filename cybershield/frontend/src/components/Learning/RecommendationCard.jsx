import { Link } from "react-router-dom";

const PRIORITY_COLORS = {
  High: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700" },
  Medium: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700" },
  Low: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-700" },
};

const TYPE_ICONS = {
  OWASP: "🛡️",
  Glossary: "📖",
  Quiz: "❓",
  Learning: "📚",
};

/**
 * Step 9 — Recommendation Card Component.
 * Displays a single learning recommendation with topic, reason, priority, and link.
 */
export default function RecommendationCard({ item, onComplete }) {
  const colors = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.Medium;
  const icon = TYPE_ICONS[item.type] || "📚";

  return (
    <div className={`rounded-lg border p-4 ${colors.bg} ${colors.border} hover:shadow-md transition`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{icon}</span>
            <h3 className={`font-semibold ${colors.text} truncate`}>{item.topic}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-2">{item.reason}</p>
          {item.owasp && (
            <span className="text-xs text-gray-500">OWASP: {item.owasp}</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
            {item.priority}
          </span>
          <span className="text-xs text-gray-400">{item.type}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        {item.link ? (
          <Link
            to={item.link}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Learn Now →
          </Link>
        ) : (
          <span className="text-sm text-gray-400">No link available</span>
        )}
        {onComplete && (
          <button
            onClick={() => onComplete(item.topic)}
            className="ml-auto text-xs text-green-600 hover:text-green-800 font-medium"
          >
            ✓ Mark Complete
          </button>
        )}
      </div>
    </div>
  );
}
