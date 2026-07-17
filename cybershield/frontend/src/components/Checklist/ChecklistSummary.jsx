/**
 * ChecklistSummary — AI recommendation card (Step 13): current vs estimated risk
 * plus the AI-generated top-priority explanation.
 */
export default function ChecklistSummary({ aiSummary, riskScore, estimatedRisk }) {
  const drop = (riskScore != null && estimatedRisk != null)
    ? Math.max(0, riskScore - estimatedRisk)
    : null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg shadow p-5">
      <p className="text-xs uppercase tracking-wide opacity-80">AI Recommendation</p>
      <p className="mt-1 text-sm leading-relaxed">
        {aiSummary || "Generating your personalised security plan…"}
      </p>

      {(riskScore != null || estimatedRisk != null) && (
        <div className="mt-4 flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs opacity-80">Current Risk</p>
            <p className="text-2xl font-bold">{riskScore ?? "—"}</p>
          </div>
          <span className="text-2xl">→</span>
          <div className="text-center">
            <p className="text-xs opacity-80">Estimated Risk</p>
            <p className="text-2xl font-bold">{estimatedRisk ?? "—"}</p>
          </div>
          {drop != null && (
            <div className="text-center ml-auto">
              <p className="text-xs opacity-80">Risk Reduction</p>
              <p className="text-2xl font-bold text-green-300">{drop}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
