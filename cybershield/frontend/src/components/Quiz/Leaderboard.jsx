import { Trophy } from "lucide-react";

/**
 * XP leaderboard list (spec Step 18). Rank = position in list (backend
 * entries do not carry a rank field).
 */
export default function Leaderboard({ entries = [] }) {
  if (!entries.length) {
    return (
      <p className="cs-qz-state" style={{ padding: "20px 8px", margin: 0 }}>
        No leaderboard data yet.
      </p>
    );
  }

  const topClass = (rank) => {
    if (rank === 1) return "cs-qz-board__rank--top1";
    if (rank === 2) return "cs-qz-board__rank--top2";
    if (rank === 3) return "cs-qz-board__rank--top3";
    return "";
  };

  return (
    <div className="cs-qz-board">
      {entries.map((e, i) => {
        const rank = i + 1;
        return (
          <div key={e.user_id || i} className="cs-qz-board__row">
            <span className={`cs-qz-board__rank ${topClass(rank)}`}>
              {rank <= 3 ? <Trophy size={14} /> : rank}
            </span>
            <div className="cs-qz-board__name">
              {e.name}
              {e.level != null && (
                <div className="cs-qz-board__meta">
                  Level {e.level} · {e.quizzes_completed} quizzes
                </div>
              )}
            </div>
            <span className="cs-qz-board__xp">{e.xp} XP</span>
          </div>
        );
      })}
    </div>
  );
}