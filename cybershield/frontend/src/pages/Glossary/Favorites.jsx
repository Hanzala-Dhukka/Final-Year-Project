import { useState, useEffect } from "react";
import { ArrowLeft, Star } from "lucide-react";
import glossaryApi from "../../api/glossaryApi";
import GlossaryCard from "../../components/Glossary/GlossaryCard";

/**
 * Favorites view (spec Step 12). Lists the user's bookmarked glossary terms.
 */
export default function Favorites({ onOpen, onBack }) {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    glossaryApi
      .favorites()
      .then((r) => setTerms(r.data))
      .catch(() => setTerms([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleFavorite = async (term) => {
    await glossaryApi.toggleFavorite(term.id);
    load();
  };

  return (
    <div className="cs-gs-row">
      <div className="cs-gs-main">
        <div className="cs-gs-card cs-gs-card--hero cs-gs-hero">
          <span className="cs-gs-hero-badge">
            <Star size={14} />
            Your saved terms
          </span>
          <h2>Favorites</h2>
          <p>Bookmarked terms you can come back to anytime for a quick refresh.</p>
        </div>

        {loading ? (
          <div className="cs-gs-state">
            <div className="cs-gs-spinner" />
            Loading…
          </div>
        ) : terms.length === 0 ? (
          <div className="cs-gs-state">
            <Star size={26} />
            No favorites yet. Tap the star on any term to save it here.
          </div>
        ) : (
          <div className="cs-gs-grid">
            {terms.map((t) => (
              <GlossaryCard
                key={t.id}
                term={t}
                onOpen={onOpen}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>

      <aside className="cs-gs-side">
        <div className="cs-gs-sticky">
          <button className="cs-gs-btn cs-gs-btn--ghost cs-gs-back" onClick={onBack}>
            <ArrowLeft size={17} />
            Back to glossary
          </button>
        </div>
      </aside>
    </div>
  );
}