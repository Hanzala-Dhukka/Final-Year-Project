/**
 * Streak card (spec Step 8). Shows current and longest streak with a flame.
 */
export default function StreakCard({ progress }) {
  if (!progress) return null;
  return (
    <div className="bg-white rounded-lg shadow p-5 text-center">
      <div className="text-4xl">🔥</div>
      <div className="text-2xl font-bold text-orange-500 mt-1">
        {progress.current_streak} Day Streak
      </div>
      <div className="text-xs text-gray-400 mt-1">
        Longest: {progress.longest_streak} days
      </div>
    </div>
  );
}
