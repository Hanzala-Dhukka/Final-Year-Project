import { QUIZ_DIFFICULTIES } from "../../api/quizApi";

/**
 * Difficulty selector (spec Step 13). Radio-style pills: Easy/Medium/Hard/Expert.
 */
export default function DifficultySelector({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUIZ_DIFFICULTIES.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={`px-4 py-1.5 rounded-full text-sm border transition ${
            value === d
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  );
}
