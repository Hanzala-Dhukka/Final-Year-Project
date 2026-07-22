import { useState, useEffect } from "react";
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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 mb-4">
        ← Back to glossary
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">⭐ Favorites</h1>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : terms.length === 0 ? (
        <p className="text-gray-400 text-sm">No favorites yet. Tap the ★ on any term.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
  );
}
