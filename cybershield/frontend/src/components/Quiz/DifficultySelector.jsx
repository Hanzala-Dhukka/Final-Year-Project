import { Gauge } from "lucide-react";
import { QUIZ_DIFFICULTIES } from "../../api/quizApi";

/**
 * Difficulty selector (spec Step 13). Gradient pills: Easy/Medium/Hard/Expert.
 */
export default function DifficultySelector({ value, onChange }) {
  return (
    <div className="cs-qz-pills">
      {QUIZ_DIFFICULTIES.map((d) => {
        const active = value === d;
        return (
          <button
            key={d}
            type="button"
            className={`cs-qz-pill ${active ? "cs-qz-pill--active" : ""}`}
            onClick={() => onChange(d)}
          >
            <Gauge size={14} />
            {d}
          </button>
        );
      })}
    </div>
  );
}