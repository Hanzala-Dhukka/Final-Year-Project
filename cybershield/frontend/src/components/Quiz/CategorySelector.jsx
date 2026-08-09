import { Layers, Cpu } from "lucide-react";
import { QUIZ_CATEGORIES, QUIZ_TECHNOLOGIES } from "../../api/quizApi";

/**
 * Category + Technology selectors (spec Steps 7 & 9).
 * Two styled dropdowns so the AI can focus the quiz on a domain and a stack.
 */
export default function CategorySelector({
  category,
  technology,
  onCategoryChange,
  onTechnologyChange,
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div className="cs-qz-field">
        <label>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Layers size={13} /> Category
          </span>
        </label>
        <select
          className="cs-qz-select"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          {QUIZ_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="cs-qz-field">
        <label>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Cpu size={13} /> Technology
          </span>
        </label>
        <select
          className="cs-qz-select"
          value={technology}
          onChange={(e) => onTechnologyChange(e.target.value)}
        >
          {QUIZ_TECHNOLOGIES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}