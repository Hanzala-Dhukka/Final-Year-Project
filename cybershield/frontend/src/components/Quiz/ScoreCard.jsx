/**
 * Score summary card (spec Step 15): score, accuracy ring, XP, rank.
 * Fully animated as part of the accent ring + Result grid layout.
 */
export default function ScoreCard({ score, total, percentage, xp, rank, correct }) {
  const deg = Math.round((percentage / 100) * 360);

  const verdict =
    percentage >= 80
      ? { text: "Excellent! You crushed it 🎉", color: "var(--success, #10b981)" }
      : percentage >= 50
      ? { text: "Good effort — keep sharpening", color: "var(--warning, #f59e0b)" }
      : { text: "Keep studying — you'll get there", color: "var(--danger, #ef4444)" };

  return (
    <div className="cs-qz-card cs-qz-score">
      <div
        className="cs-qz-score__ring"
        style={{ "--p": `${deg}deg` }}
      >
        <div className="cs-qz-score__ring-inner">
          <span className="cs-qz-score__pct">{percentage}%</span>
          <span className="cs-qz-score__label">accuracy</span>
        </div>
      </div>

      <div className="cs-qz-score__meta">
        <h2 className="cs-qz-score__title">Quiz Complete</h2>
        <p className="cs-qz-score__sub" style={{ color: verdict.color }}>
          {verdict.text}
        </p>

        <div className="cs-qz-stats">
          <div className="cs-qz-stat">
            <div className="cs-qz-stat__value">
              {score}/{total}
            </div>
            <div className="cs-qz-stat__label">Score</div>
          </div>
          <div className="cs-qz-stat">
            <div className="cs-qz-stat__value cs-qz-stat__value--xp">+{xp}</div>
            <div className="cs-qz-stat__label">XP Earned</div>
          </div>
          <div className="cs-qz-stat">
            <div className="cs-qz-stat__value cs-qz-stat__value--rank">
              #{rank || "—"}
            </div>
            <div className="cs-qz-stat__label">Global Rank</div>
          </div>
          <div className="cs-qz-stat">
            <div className="cs-qz-stat__value cs-qz-stat__value--correct">
              {correct != null ? correct : score}
            </div>
            <div className="cs-qz-stat__label">Correct</div>
          </div>
        </div>
      </div>
    </div>
  );
}