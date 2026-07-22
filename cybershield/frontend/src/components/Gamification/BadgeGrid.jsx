/**
 * Badge grid (spec Step 14). Shows earned vs locked badges.
 */
export default function BadgeGrid({ badges }) {
  if (!badges) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {badges.map((b) => (
        <div
          key={b.key}
          className={`rounded-lg border p-3 text-center ${
            b.unlocked
              ? "border-yellow-300 bg-yellow-50"
              : "border-gray-200 bg-gray-50 opacity-60"
          }`}
        >
          <div className="text-2xl">{b.unlocked ? "🏅" : "🔒"}</div>
          <div className="text-sm font-medium text-gray-800 mt-1">{b.name}</div>
          <div className="text-[11px] text-gray-400">{b.unlocked ? "Unlocked" : "Locked"}</div>
        </div>
      ))}
    </div>
  );
}
