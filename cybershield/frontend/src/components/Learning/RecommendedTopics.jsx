import RecommendationCard from "./RecommendationCard";

/**
 * Step 10 — Recommended Topics list.
 * Groups recommendations by type and renders cards.
 */
export default function RecommendedTopics({ recommendations, onComplete }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-lg mb-1">No recommendations yet</p>
        <p className="text-sm">Run a security scan to get personalized learning recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>📋</span> Recommended Learning
        </h2>
        <span className="text-sm text-gray-400">{recommendations.length} topics</span>
      </div>
      {recommendations.map((item, index) => (
        <RecommendationCard key={index} item={item} onComplete={onComplete} />
      ))}
    </div>
  );
}
