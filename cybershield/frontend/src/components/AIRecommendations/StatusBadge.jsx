/**
 * Coloured status badge for remediation items (Open / In Progress / Fixed).
 */
const COLORS = {
  Open: "bg-red-100 text-red-700",
  "In Progress": "bg-amber-100 text-amber-700",
  Fixed: "bg-green-100 text-green-700",
};

export default function StatusBadge({ status }) {
  const cls = COLORS[status] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}
