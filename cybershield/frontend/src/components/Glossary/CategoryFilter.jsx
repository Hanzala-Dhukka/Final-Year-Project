import { Layers } from "lucide-react";
import { GLOSSARY_CATEGORIES } from "../../api/glossaryApi";

/**
 * Category filter chips (spec Step 4 / Step 17).
 */
export default function CategoryFilter({ value, onChange }) {
  return (
    <div className="cs-gs-chips">
      <button
        className={`cs-gs-chip ${!value ? "cs-gs-chip--active" : ""}`}
        onClick={() => onChange(null)}
      >
        <Layers size={13} />
        All
      </button>
      {GLOSSARY_CATEGORIES.map((c) => (
        <button
          key={c}
          className={`cs-gs-chip ${value === c ? "cs-gs-chip--active" : ""}`}
          onClick={() => onChange(c === value ? null : c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}