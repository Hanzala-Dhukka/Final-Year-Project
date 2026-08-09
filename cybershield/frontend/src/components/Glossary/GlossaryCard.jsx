import { BookOpen, ChevronRight, Star } from "lucide-react";

/**
 * Glossary term card (spec Step 17). Shows term, category, difficulty and
 * optional favorite star; opens the detail page on click.
 */
export default function GlossaryCard({ term, onOpen, onToggleFavorite }) {
  return (
    <button
      onClick={() => onOpen && onOpen(term.id)}
      className="cs-gs-term"
    >
      <div className="cs-gs-term__top">
        <h3 className="cs-gs-term__name">{term.term}</h3>
        <span
          role="button"
          className={`cs-gs-fav ${term.is_favorite ? "cs-gs-fav--active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite && onToggleFavorite(term);
          }}
          title={term.is_favorite ? "Remove favorite" : "Add favorite"}
        >
          <Star size={18} fill={term.is_favorite ? "currentColor" : "none"} />
        </span>
      </div>

      <div className="cs-gs-term__badges">
        <span className="cs-gs-badge cs-gs-badge--category">
          <BookOpen size={11} />
          {term.category}
        </span>
        {term.difficulty && (
          <span className="cs-gs-badge cs-gs-badge--neutral">{term.difficulty}</span>
        )}
      </div>

      <p className="cs-gs-term__desc">{term.definition}</p>

      <div className="cs-gs-term__foot">
        Learn more
        <ChevronRight size={14} />
      </div>
    </button>
  );
}