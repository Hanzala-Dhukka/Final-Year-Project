import colors from "../../styles/colors";

const severityColor = {
  Critical: colors.critical,
  High: colors.high,
  Medium: colors.medium,
  Low: colors.low,
};

const statusLabel = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

/**
 * ChecklistCard — displays a single security hardening task (Step 12).
 */
export default function ChecklistCard({ item, onToggle }) {
  const done = item.status === "completed";

  return (
    <div
      className="bg-white rounded-lg shadow p-4 border-l-4"
      style={{ borderLeftColor: severityColor[item.severity] || colors.border }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded text-white"
              style={{ backgroundColor: severityColor[item.severity] || colors.textSecondary }}
            >
              {item.severity}
            </span>
            <span className="text-xs text-gray-500">{item.category}</span>
          </div>
          <h3 className={`font-semibold ${done ? "line-through text-gray-400" : "text-gray-800"}`}>
            {item.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          {item.frameworks?.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Framework: {item.frameworks.join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${
            done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {statusLabel[item.status] || item.status}
        </span>
        <button
          onClick={() => onToggle(item)}
          className={`px-3 py-1.5 text-sm rounded-lg text-white ${
            done ? "bg-gray-400 hover:bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {done ? "Mark Incomplete" : "Mark Complete"}
        </button>
      </div>
    </div>
  );
}
