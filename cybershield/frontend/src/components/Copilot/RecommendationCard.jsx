/**
 * A single AI recommendation item (spec Step 10 "AI Recommendations").
 */
export default function RecommendationCard({ index, text }) {
  return (
    <div className="flex items-start gap-3 border border-gray-200 rounded-lg p-3 bg-white">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
        {index + 1}
      </span>
      <p className="text-sm text-gray-700">{text}</p>
    </div>
  );
}
