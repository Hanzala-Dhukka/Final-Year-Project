import { QUIZ_CATEGORIES, QUIZ_TECHNOLOGIES } from "../../api/quizApi";

/**
 * Category + Technology selectors (spec Steps 7 & 9).
 * Two dropdowns so the AI can focus the quiz on a domain and a stack.
 */
export default function CategorySelector({
  category,
  technology,
  onCategoryChange,
  onTechnologyChange,
}) {
  const selectCls =
    "border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label className="block">
        <span className="text-sm text-gray-500">Category</span>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={`mt-1 w-full ${selectCls}`}
        >
          {QUIZ_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm text-gray-500">Technology</span>
        <select
          value={technology}
          onChange={(e) => onTechnologyChange(e.target.value)}
          className={`mt-1 w-full ${selectCls}`}
        >
          {QUIZ_TECHNOLOGIES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
