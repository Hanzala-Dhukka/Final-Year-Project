/**
 * Glossary term card (spec Step 17). Shows term, category, difficulty and
 * optional favorite star; opens the detail page on click.
 */
export default function GlossaryCard({ term, onOpen, onToggleFavorite }) {
  return (
    <div
      onClick={() => onOpen && onOpen(term.id)}
      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition border border-transparent hover:border-blue-200"
    >
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-gray-800">{term.term}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite && onToggleFavorite(term);
          }}
          className={`text-lg ${term.is_favorite ? "text-yellow-400" : "text-gray-300 hover:text-yellow-400"}`}
          title={term.is_favorite ? "Remove favorite" : "Add favorite"}
        >
          ★
        </button>
      </div>
      <div className="mt-1 flex gap-2 items-center text-xs">
        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600">
          {term.category}
        </span>
        {term.difficulty && (
          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500">
            {term.difficulty}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
        {term.definition}
      </p>
    </div>
  );
}
