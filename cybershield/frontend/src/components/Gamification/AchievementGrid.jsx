/**
 * Achievement grid (spec Step 14). Shows unlocked vs locked achievements.
 */
export default function AchievementGrid({ achievements }) {
  if (!achievements) return null;
  const unlocked = achievements.filter((a) => a.unlocked).length;
  return (
    <div>
      <div className="text-sm text-gray-500 mb-3">
        {unlocked} / {achievements.length} unlocked
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {achievements.map((a) => (
          <div
            key={a.key}
            className={`rounded-lg border p-4 flex items-start gap-3 ${
              a.unlocked ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="text-2xl">{a.unlocked ? a.icon || "🏆" : "🔒"}</div>
            <div>
              <div className="font-semibold text-gray-800">{a.name}</div>
              <div className="text-xs text-gray-500">{a.description}</div>
              {a.unlocked && a.xp_reward > 0 && (
                <div className="text-xs text-green-600 mt-1">+{a.xp_reward} XP</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
