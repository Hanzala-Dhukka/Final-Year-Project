/**
 * ChecklistFilter — severity + category filters (Step 13).
 */
const SEVERITIES = ["All", "Critical", "High", "Medium", "Low"];

export default function ChecklistFilter({
  categories = [],
  severity,
  category,
  onSeverity,
  onCategory,
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">Filter by Severity</p>
        <div className="flex flex-wrap gap-2">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              onClick={() => onSeverity(s)}
              className={`px-3 py-1 text-sm rounded ${
                severity === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">Filter by Category</p>
        <select
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          value={category}
          onChange={(e) => onCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
