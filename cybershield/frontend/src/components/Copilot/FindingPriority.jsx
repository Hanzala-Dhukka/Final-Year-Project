import SeverityBadge from "../CodeReview/SeverityBadge";

/**
 * Prioritised list of findings, ordered Critical -> High -> Medium -> Low
 * (spec Step 7 "Risk Prioritization").
 */
const PRIORITY_ICON = {
  Critical: "🔥",
  High: "⚠️",
  Medium: "•",
  Low: "•",
};

export default function FindingPriority({ findings = [] }) {
  if (!findings || findings.length === 0) {
    return <p className="text-sm text-gray-400">No critical issues found. 🎉</p>;
  }
  return (
    <ul className="space-y-2">
      {findings.map((f, i) => (
        <li key={i} className="flex items-center gap-2">
          <span>{PRIORITY_ICON[f.severity] || "•"}</span>
          <SeverityBadge severity={f.severity} />
          <span className="text-sm text-gray-700">{f.title || f}</span>
        </li>
      ))}
    </ul>
  );
}
