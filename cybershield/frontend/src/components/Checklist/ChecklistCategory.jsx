/**
 * ChecklistCategory — per-category completion bar (Step 11).
 */
function barColor(score) {
  if (score >= 80) return "#10B981";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

export default function ChecklistCategory({ category, total, completed, score }) {
  const pct = Math.round(score) || 0;
  const filled = Math.round((pct / 100) * 10); // 10-segment bar

  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-gray-700 w-40 truncate">{category}</span>
      <div className="flex-1 mx-3 flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="h-3 flex-1 rounded-sm"
            style={{ backgroundColor: i < filled ? barColor(score) : "#E5E7EB" }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 w-16 text-right">
        {completed}/{total}
      </span>
    </div>
  );
}
