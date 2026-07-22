/**
 * Learning progress card (spec Step 13).
 */
export default function ProgressCard({ progress }) {
  if (!progress) return null;

  const stats = [
    { label: "Terms Viewed", value: progress.terms_viewed },
    { label: "Terms Learned", value: progress.terms_learned },
    { label: "Flashcards", value: progress.flashcards_completed },
    { label: "Quizzes Passed", value: progress.mini_quizzes_passed },
    { label: "Favorites", value: progress.favorite_count },
    { label: "Study Streak", value: progress.study_streak },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="font-semibold text-gray-800 mb-3">📈 Your Progress</h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <div className="text-xs text-gray-500 mb-1">
          Glossary mastery: {progress.percentage}%
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {progress.terms_learned} / {progress.total_terms} terms learned
        </p>
      </div>
    </div>
  );
}
