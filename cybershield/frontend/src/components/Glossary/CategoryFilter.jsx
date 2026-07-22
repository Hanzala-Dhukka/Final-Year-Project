import { GLOSSARY_CATEGORIES } from "../../api/glossaryApi";

/**
 * Category filter chips (spec Step 4 / Step 17).
 */
export default function CategoryFilter({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1 rounded-full text-sm border ${
          !value
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
        }`}
      >
        All
      </button>
      {GLOSSARY_CATEGORIES.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c === value ? null : c)}
          className={`px-3 py-1 rounded-full text-sm border ${
            value === c
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
