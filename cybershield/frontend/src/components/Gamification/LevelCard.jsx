/**
 * Level card (spec Step 13). Displays current level + title prominently.
 */
export default function LevelCard({ progress }) {
  if (!progress) return null;
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow p-5">
      <div className="text-xs uppercase tracking-wide opacity-80">Level</div>
      <div className="text-3xl font-bold">{progress.level}</div>
      <div className="text-sm opacity-90">{progress.level_title}</div>
    </div>
  );
}
