/**
 * XP leaderboard table (spec Step 18).
 */
export default function Leaderboard({ entries = [] }) {
  if (!entries.length) {
    return (
      <p className="text-sm text-gray-400 px-2 py-4">No leaderboard data yet.</p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-200">
            <th className="py-2 px-2">#</th>
            <th className="py-2 px-2">Name</th>
            <th className="py-2 px-2">XP</th>
            <th className="py-2 px-2">Avg</th>
            <th className="py-2 px-2">Quizzes</th>
            <th className="py-2 px-2">Lvl</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.user_id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-2 font-semibold text-gray-700">{e.rank}</td>
              <td className="py-2 px-2 text-gray-800">{e.name}</td>
              <td className="py-2 px-2 text-indigo-600 font-semibold">{e.xp}</td>
              <td className="py-2 px-2 text-gray-600">{e.average_score}%</td>
              <td className="py-2 px-2 text-gray-600">{e.quizzes_completed}</td>
              <td className="py-2 px-2 text-gray-600">{e.level}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
