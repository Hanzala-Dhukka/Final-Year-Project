import { useState, useEffect } from "react";
import gamificationApi from "../../api/gamificationApi";

/**
 * Global XP leaderboard (spec Step 9/15). Sorted by XP; shows rank, name, XP,
 * level, and badge count.
 */
export default function Leaderboard({ onBack }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gamificationApi
      .leaderboard(50)
      .then((r) => setEntries(r.data.leaderboard || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {onBack && (
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 mb-4">
          ← Back
        </button>
      )}
      <h1 className="text-3xl font-bold text-gray-900 mb-1">🏆 Global Leaderboard</h1>
      <p className="text-gray-500 mb-6">Top CyberShield learners by XP.</p>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-400">No data yet — complete some activities!</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 px-4">#</th>
                <th className="py-2 px-4">User</th>
                <th className="py-2 px-4">XP</th>
                <th className="py-2 px-4">Level</th>
                <th className="py-2 px-4">Badges</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-4 font-semibold text-gray-700">
                    {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : e.rank}
                  </td>
                  <td className="py-2 px-4 text-gray-800">{e.name}</td>
                  <td className="py-2 px-4 text-indigo-600 font-semibold">{e.xp}</td>
                  <td className="py-2 px-4 text-gray-600">{e.level}</td>
                  <td className="py-2 px-4 text-gray-600">{e.badge_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
