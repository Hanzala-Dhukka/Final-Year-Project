import { TrendingUp } from "lucide-react";

/**
 * Learning progress card (spec Step 13).
 */
export default function ProgressCard({ progress }) {
  if (!progress) return null;

  const stats = [
    { label: "Viewed", value: progress.terms_viewed },
    { label: "Learned", value: progress.terms_learned },
    { label: "Flashcards", value: progress.flashcards_completed },
    { label: "Quizzes", value: progress.mini_quizzes_passed },
    { label: "Favorites", value: progress.favorite_count },
    { label: "Streak", value: progress.study_streak },
  ];

  return (
    <div className="cs-gs-card">
      <h3 className="cs-gs-section-title">
        <span className="cs-gs-icon-wrap">
          <TrendingUp size={17} />
        </span>
        Your Progress
      </h3>

      <div className="cs-gs-progress-head">
        <div
          className="cs-gs-ring"
          style={{ "--p": `${progress.percentage * 3.6}deg` }}
        >
          <div className="cs-gs-ring__inner">
            <span className="cs-gs-ring__pct">{progress.percentage}%</span>
            <span className="cs-gs-ring__label">mastery</span>
          </div>
        </div>
        <div className="cs-gs-progress-meta">
          <p className="cs-gs-progress-title">Glossary mastery</p>
          <p className="cs-gs-progress-sub">
            {progress.terms_learned} / {progress.total_terms} terms learned
          </p>
        </div>
      </div>

      <div className="cs-gs-stats" style={{ marginTop: "16px" }}>
        {stats.map((s) => (
          <div key={s.label} className="cs-gs-stat">
            <div className="cs-gs-stat__value">{s.value}</div>
            <div className="cs-gs-stat__label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}