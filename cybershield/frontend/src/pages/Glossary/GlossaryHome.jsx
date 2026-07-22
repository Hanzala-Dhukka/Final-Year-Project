import { useState, useEffect, useCallback } from "react";
import glossaryApi, { GLOSSARY_CATEGORIES } from "../../api/glossaryApi";
import SearchBar from "../../components/Glossary/SearchBar";
import CategoryFilter from "../../components/Glossary/CategoryFilter";
import GlossaryCard from "../../components/Glossary/GlossaryCard";
import ProgressCard from "../../components/Glossary/ProgressCard";

/**
 * Glossary home (spec Step 17). Search + category filter + term cards + progress.
 */
export default function GlossaryHome({ onOpen }) {
  const [terms, setTerms] = useState([]);
  const [category, setCategory] = useState(null);
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);

  const loadProgress = useCallback(() => {
    glossaryApi
      .progress()
      .then((r) => setProgress(r.data))
      .catch(() => setProgress(null));
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    setLoading(true);
    const run = query
      ? glossaryApi.search(query, category)
      : category
      ? glossaryApi.byCategory(category)
      : glossaryApi.list({ limit: 200 });

    run
      .then((r) => setTerms(r.data.results || r.data.terms || []))
      .catch(() => setTerms([]))
      .finally(() => setLoading(false));
  }, [query, category]);

  const toggleFavorite = async (term) => {
    try {
      await glossaryApi.toggleFavorite(term.id);
      loadProgress(); // refresh favorite count
      // Flip local state immediately
      setTerms((prev) =>
        prev.map((t) =>
          t.id === term.id ? { ...t, is_favorite: !t.is_favorite } : t
        )
      );
    } catch (e) {
      /* ignore */
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">📚 CyberShield Glossary</h1>
        <button
          onClick={() => setShowSuggest(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
        >
          + Suggest a Term
        </button>
      </div>
      <p className="text-gray-500 mb-6">
        Browse hundreds of curated cybersecurity terms. Search, favorite, and learn with flashcards.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <SearchBar onSearch={setQuery} />
          <CategoryFilter value={category} onChange={setCategory} />

          {loading ? (
            <p className="text-gray-400 text-sm py-8">Loading…</p>
          ) : terms.length === 0 ? (
            <p className="text-gray-400 text-sm py-8">No terms found.</p>
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

        <div className="space-y-4">
          <ProgressCard progress={progress} />
          <div className="bg-white rounded-lg shadow p-5 text-sm text-gray-600">
            <p className="font-semibold mb-2">💡 Tip</p>
            <p>Open a term to get an AI explanation, take a mini quiz, and export it as a PDF.</p>
          </div>
        </div>
      </div>

      {showSuggest && (
        <SuggestTermModal onClose={() => setShowSuggest(false)} />
      )}
    </div>
  );
}

/**
 * User suggestion modal (spec Step 15). Submits a term for admin review.
 */
function SuggestTermModal({ onClose }) {
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [category, setCategory] = useState(GLOSSARY_CATEGORIES[0]);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    try {
      await glossaryApi.suggest({ term, definition, category, reason });
      setStatus("submitted");
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to submit suggestion.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Suggest a Term</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {status === "submitted" ? (
          <div className="text-center py-6">
            <p className="text-green-600 font-semibold">✅ Submitted for review!</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Term (e.g. CSRF)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Definition"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {GLOSSARY_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why should we add this? (optional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              onClick={submit}
              disabled={!term || !definition}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Submit Suggestion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
