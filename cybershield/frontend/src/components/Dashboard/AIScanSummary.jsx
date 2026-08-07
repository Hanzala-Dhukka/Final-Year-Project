/**
 * AI Scan Summary — Module E3, Step 9.
 *
 * Displays the AI-generated executive security overview after a scan.
 * Shows risk level, summary text, top risks, and priority actions.
 */

const RISK_COLORS = {
  Critical: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", dot: "bg-red-500" },
  High: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", dot: "bg-orange-500" },
  Medium: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700", dot: "bg-yellow-500" },
  Low: { bg: "bg-green-50", border: "border-green-300", text: "text-green-700", dot: "bg-green-500" },
};

export default function AIScanSummary({ summary, loading }) {
  // Step 11 — Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🤖</span>
          <div className="h-5 bg-gray-200 rounded w-48" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const colors = RISK_COLORS[summary.risk_level] || RISK_COLORS.Medium;

  return (
    <div className={`rounded-lg border p-5 ${colors.bg} ${colors.border}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🤖</span>
        <h2 className="text-lg font-bold text-gray-800">AI Security Summary</h2>
      </div>

      {/* Risk Level Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-3 h-3 rounded-full ${colors.dot}`} />
        <span className={`font-semibold ${colors.text}`}>
          Risk Level: {summary.risk_level}
        </span>
        {summary.security_score != null && (
          <span className="text-sm text-gray-500 ml-2">
            (Score: {summary.security_score}/100)
          </span>
        )}
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-700 mb-4">{summary.summary}</p>

      {/* Top Risks */}
      {summary.top_risks && summary.top_risks.length > 0 && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Main Concerns</h3>
          <ul className="space-y-1">
            {summary.top_risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-red-400 mt-0.5">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Priority Actions */}
      {summary.priority_actions && summary.priority_actions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Priority Actions</h3>
          <ul className="space-y-1">
            {summary.priority_actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-blue-500 mt-0.5">→</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
