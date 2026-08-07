/**
 * Step 13 — Learning Status UI.
 * Displays the user's security growth with progress bars for each category.
 */
export default function ProgressCard({ progress }) {
  if (!progress) return null;

  const completed = progress.completed || [];
  const percentage = progress.percentage || 0;

  // Group completed topics for display
  const topicGroups = [
    { name: "SQL Injection", keywords: ["SQL", "Injection", "Prepared"] },
    { name: "XSS", keywords: ["XSS", "Output Encoding", "CSP"] },
    { name: "OWASP", keywords: ["OWASP", "A01", "A03", "A05", "A06", "A07", "A10"] },
    { name: "Secrets", keywords: ["Secret", "Environment"] },
    { name: "Access Control", keywords: ["Access", "Authorization", "RBAC"] },
    { name: "CSRF", keywords: ["CSRF", "Request Forgery"] },
  ];

  const groupProgress = topicGroups.map((g) => {
    const count = completed.filter((t) =>
      g.keywords.some((kw) => t.toLowerCase().includes(kw.toLowerCase()))
    ).length;
    return { ...g, count, total: g.keywords.length };
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
        <span>📈</span> Your Security Growth
      </h2>

      {/* Overall progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-700">Overall Progress</span>
          <span className="text-blue-600 font-semibold">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {completed.length} topic{completed.length !== 1 ? "s" : ""} completed
        </p>
      </div>

      {/* Per-category progress */}
      <div className="space-y-3">
        {groupProgress.map((g) => {
          const pct = Math.round((g.count / Math.max(g.total, 1)) * 100);
          const barColor =
            pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-gray-400";

          return (
            <div key={g.name}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="font-medium text-gray-600">{g.name}</span>
                <span className="text-gray-400">{pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`${barColor} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
