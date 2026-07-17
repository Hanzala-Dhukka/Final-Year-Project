/**
 * Coloured severity badge (Critical / High / Medium / Low).
 */
const COLORS = {
  Critical: "bg-red-600 text-white",
  High: "bg-orange-500 text-white",
  Medium: "bg-yellow-400 text-gray-900",
  Low: "bg-blue-500 text-white",
};

export default function SeverityBadge({ severity }) {
  const cls = COLORS[severity] || "bg-gray-400 text-white";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {severity}
    </span>
  );
}
