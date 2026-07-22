/**
 * Related terms list (spec Step 11). Each term navigates to its detail page.
 */
export default function RelatedTerms({ terms, onOpen }) {
  if (!terms || terms.length === 0) {
    return (
      <p className="text-sm text-gray-400">No related terms yet.</p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {terms.map((t) => (
        <button
          key={t.id}
          onClick={() => onOpen && onOpen(t.id)}
          className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm hover:bg-blue-50 hover:text-blue-700"
        >
          {t.term}
        </button>
      ))}
    </div>
  );
}
