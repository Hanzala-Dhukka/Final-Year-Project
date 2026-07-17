import SeverityBadge from "../CodeReview/SeverityBadge";

/**
 * A single risk/issue card (e.g. from GitHub scan or code review).
 */
export default function RiskCard({ title, severity, detail }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-800">{title}</span>
        <SeverityBadge severity={severity} />
      </div>
      {detail && <p className="text-sm text-gray-600 mt-1">{detail}</p>}
    </div>
  );
}
