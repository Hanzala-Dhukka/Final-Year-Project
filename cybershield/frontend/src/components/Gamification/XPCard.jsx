/**
 * XP summary card (spec Step 13). Level, XP total, and progress to next level.
 */
import ProgressRing from "./ProgressRing";

export default function XPCard({ progress }) {
  if (!progress) return null;
  return (
    <div className="bg-white rounded-lg shadow p-5 flex items-center gap-5">
      <ProgressRing value={progress.level_progress}>
        <div>
          <div className="text-2xl font-bold text-blue-600">{progress.level}</div>
          <div className="text-[10px] text-gray-400">LEVEL</div>
        </div>
      </ProgressRing>
      <div className="flex-1">
        <div className="text-xs text-gray-400">Level {progress.level} · {progress.level_title}</div>
        <div className="text-xl font-bold text-gray-800">{progress.xp} XP</div>
        <div className="text-xs text-gray-500">
          {progress.xp_to_next} XP to next level
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-blue-600" style={{ width: `${progress.level_progress}%` }} />
        </div>
      </div>
    </div>
  );
}
