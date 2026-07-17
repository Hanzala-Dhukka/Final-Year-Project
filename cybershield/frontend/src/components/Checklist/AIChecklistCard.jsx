import PriorityBadge from "./PriorityBadge";
import DifficultyBadge from "./DifficultyBadge";

/**
 * AIChecklistCard — a single AI-generated remediation task (Step 12).
 */
export default function AIChecklistCard({ item, index, onToggle }) {
  const done = item.completed;
  return (
    <div
      className="bg-white rounded-lg shadow p-4 border-l-4"
      style={{ borderLeftColor: done ? "#10B981" : "#2563EB" }}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={!!done}
          onChange={() => onToggle(index)}
          className="mt-1 h-5 w-5 accent-blue-600"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <PriorityBadge priority={item.priority} />
            <DifficultyBadge difficulty={item.difficulty} />
            {item.estimated_time && (
              <span className="text-xs text-gray-500">⏱ {item.estimated_time}</span>
            )}
            {item.risk_reduction && (
              <span className="text-xs font-semibold text-green-600">
                ↓ Risk -{String(item.risk_reduction).replace("%", "")}%
              </span>
            )}
          </div>
          <h3 className={`font-semibold ${done ? "line-through text-gray-400" : "text-gray-800"}`}>
            {item.title}
          </h3>
          {item.description && (
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          )}
          {item.framework && (
            <p className="text-xs text-gray-400 mt-1">Framework: {item.framework}</p>
          )}
          {item.reason && (
            <p className="text-sm text-gray-500 mt-2 italic">“{item.reason}”</p>
          )}
        </div>
      </div>
    </div>
  );
}
