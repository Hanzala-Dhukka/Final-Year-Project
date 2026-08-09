import { Layers, Cpu } from "lucide-react";

/**
 * A single quiz question with one-select options (spec Step 14).
 * Enforces "one answer per question" by swapping the selected option.
 */
export default function QuestionCard({ index, question, selected, onSelect }) {
  const item = typeof question === "string" ? { question, options: [] } : question;

  return (
    <div className="cs-qz-question">
      <div className="cs-qz-question__head">
        <span className="cs-qz-qnum">{index + 1}</span>
        {item.category && (
          <span className="cs-qz-badge cs-qz-badge--category">
            <Layers size={11} />
            {item.category}
          </span>
        )}
        {item.technology && (
          <span className="cs-qz-badge cs-qz-badge--tech">
            <Cpu size={11} />
            {item.technology}
          </span>
        )}
      </div>

      <p className="cs-qz-question__text">{item.question}</p>

      <div className="cs-qz-options">
        {(item.options || []).map((opt, i) => {
          const isSelected = selected === opt;
          return (
            <button
              key={i}
              type="button"
              className={`cs-qz-option ${isSelected ? "cs-qz-option--selected" : ""}`}
              onClick={() => onSelect(opt)}
            >
              <span className="cs-qz-option__marker" />
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}