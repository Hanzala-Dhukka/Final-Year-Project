import { useState, useEffect, useCallback } from "react";
import { BookOpen, Lightbulb, Plus, Search, X, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
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
    <div className="cs-gs-row">
      <div className="cs-gs-main">
        <section className="cs-gs-card cs-gs-card--hero cs-gs-hero">
          <span className="cs-gs-hero-badge">
            <ShieldCheck size={14} />
            Cybersecurity Knowledge Base
          </span>
          <h2>Master the terms that keep systems secure</h2>
          <p>
            Search, favorite, and learn from dozens of curated terms — then test yourself
            with mini quizzes and flashcards to lock it all in.
          </p>
          <div className="cs-gs-hero__badges">
            <span className="cs-gs-badge cs-gs-badge--category">
              <BookOpen size={12} /> {GLOSSARY_CATEGORIES.length} categories
            </span>
            {progress && (
              <span className="cs-gs-badge cs-gs-badge--success">
                <CheckCircle2 size={12} /> {progress.terms_learned}/{progress.total_terms} learned
              </span>
            )}
          </div>
        </section>

        <SearchBar onSearch={setQuery} />

        <CategoryFilter value={category} onChange={setCategory} />

        {loading ? (
          <div className="cs-gs-state">
            <div className="cs-gs-spinner" />
            Listening…
          </div>
        ) : terms.length === 0 ? (
          <div className="cs-gs-state">
            <Search size={26} />
            No terms found — try a different search or category.
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

        <div className="cs-gs-actions" style={{ justifyContent: "flex-start" }}>
          <button className="cs-gs-btn cs-gs-btn--primary" onClick={() => setShowSuggest(true)}>
            <Plus size={18} />
            Suggest a Term
          </button>
        </div>
      </div>

      <aside className="cs-gs-side">
        <div className="cs-gs-sticky">
          <ProgressCard progress={progress} />
          <div className="cs-gs-card cs-gs-tip">
            <div className="cs-gs-tip__icon">
              <Lightbulb size={16} />
            </div>
            <div className="cs-gs-tip__body">
              <h4>Pro tip</h4>
              <p>
                Open a term to get an AI explanation, take a mini quiz, and export it
                as a PDF for offline study.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {showSuggest && <SuggestTermModal onClose={() => setShowSuggest(false)} />}
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
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await glossaryApi.suggest({ term, definition, category, reason });
      setStatus("submitted");
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to submit suggestion.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cs-gs-modal-backdrop" onClick={onClose}>
      <div className="cs-gs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cs-gs-modal__head">
          <h2>Suggest a Term</h2>
          <button className="cs-gs-modal__close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {status === "submitted" ? (
          <div className="cs-gs-state" style={{ padding: "24px 0" }}>
            <CheckCircle2 size={40} color="var(--success, #10b981)" />
            <p style={{ color: "var(--success, #10b981)" }}>Submitted for review!</p>
            <button className="cs-gs-btn cs-gs-btn--primary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="cs-gs-field">
              <label>Term</label>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="e.g. CSRF"
              />
            </div>
            <div className="cs-gs-field">
              <label>Definition</label>
              <textarea
                value={definition}
                onChange={(e) => setDefinition(e.target.value)}
                placeholder="Short, accurate definition"
                rows={3}
              />
            </div>
            <div className="cs-gs-field">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {GLOSSARY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="cs-gs-field">
              <label>Reason (optional)</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why should we add this?"
              />
            </div>

            {error && (
              <p className="cs-gs-error">
                <AlertCircle size={14} />
                {error}
              </p>
            )}

            <button
              className="cs-gs-btn cs-gs-btn--primary"
              style={{ width: "100%" }}
              onClick={submit}
              disabled={!term || !definition || submitting}
            >
              {submitting ? "Submitting…" : "Submit Suggestion"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}