import { ChevronRight } from "lucide-react";

/**
 * Related terms list (spec Step 11). Each term navigates to its detail page.
 */
export default function RelatedTerms({ terms, onOpen }) {
  if (!terms || terms.length === 0) {
    return (
      <p className="cs-gs-state" style={{ padding: "16px 0", margin: 0 }}>
        No related terms yet.
      </p>
    );
  }
  return (
    <div className="cs-gs-related">
      {terms.map((t) => (
        <button
          key={t.id}
          className="cs-gs-goto"
          onClick={() => onOpen && onOpen(t.id)}
        >
          {t.term}
          <ChevronRight size={14} />
        </button>
      ))}
    </div>
  );
}