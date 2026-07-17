/**
 * ChecklistProgress — security score gauge + summary (Step 9, Step 11).
 */
export default function ChecklistProgress({ score, completed, total }) {
  const pct = Math.round(score) || 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const color = pct >= 80 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="bg-white rounded-lg shadow p-5 flex items-center gap-5">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle
          cx="65" cy="65" r={radius}
          fill="none" stroke="#E5E7EB" strokeWidth="12"
        />
        <circle
          cx="65" cy="65" r={radius}
          fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
        />
        <text x="65" y="62" textAnchor="middle" fontSize="26" fontWeight="bold" fill={color}>
          {pct}%
        </text>
        <text x="65" y="82" textAnchor="middle" fontSize="11" fill="#6B7280">
          Security Score
        </text>
      </svg>

      <div>
        <p className="text-sm text-gray-500">Completed Tasks</p>
        <p className="text-2xl font-bold text-gray-800">
          {completed} <span className="text-gray-400 text-base">/ {total}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Score = Completed / Total × 100
        </p>
      </div>
    </div>
  );
}
