const LEVEL_COLORS = {
  Beginner: "bg-green-100 text-green-800 border-green-300",
  Intermediate: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Advanced: "bg-red-100 text-red-800 border-red-300",
};

const LEVEL_ICONS = {
  Beginner: "🟢",
  Intermediate: "🟡",
  Advanced: "🔴",
};

/**
 * Step 10 — AI-generated Learning Path display.
 * Shows a structured roadmap with Beginner → Intermediate → Advanced topics.
 */
export default function LearningPath({ path }) {
  if (!path || !path.learning_path || path.learning_path.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">🗺️</span>
        <h2 className="text-lg font-bold text-gray-800">AI Learning Path</h2>
      </div>
      {path.summary && (
        <p className="text-sm text-gray-500 mb-4">{path.summary}</p>
      )}

      <div className="space-y-4">
        {["Beginner", "Intermediate", "Advanced"].map((level) => {
          const topics = path.learning_path.filter((t) => t.level === level);
          if (topics.length === 0) return null;

          return (
            <div key={level}>
              <div className="flex items-center gap-2 mb-2">
                <span>{LEVEL_ICONS[level]}</span>
                <span className={`text-sm font-semibold px-2 py-0.5 rounded-full border ${LEVEL_COLORS[level]}`}>
                  {level}
                </span>
              </div>
              <div className="ml-7 space-y-2">
                {topics.map((t, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-gray-400 text-sm mt-0.5">•</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.topic}</p>
                      {t.reason && (
                        <p className="text-xs text-gray-500">{t.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {path.estimated_time && (
        <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
          Estimated time: {path.estimated_time}
        </p>
      )}
      {path.top_priority && (
        <p className="text-xs text-blue-600 mt-1 font-medium">
          Top priority: {path.top_priority}
        </p>
      )}
    </div>
  );
}
