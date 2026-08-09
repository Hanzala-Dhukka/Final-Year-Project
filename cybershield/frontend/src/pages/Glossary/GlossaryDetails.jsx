import { useState, useEffect } from "react";
import { ArrowLeft, Sparkles, Download, FileQuestion, AlertCircle, Bot, Star, BookOpen } from "lucide-react";
import glossaryApi from "../../api/glossaryApi";
import MarkdownRenderer from "../../components/AIAssistant/MarkdownRenderer";
import MiniQuiz from "../../components/Glossary/MiniQuiz";
import RelatedTerms from "../../components/Glossary/RelatedTerms";

/**
 * Glossary term detail page (spec Step 18).
 * Shows definition, example, prevention, business context, AI explain, mini
 * quiz, related terms, PDF export, and favorite toggle.
 */
export default function GlossaryDetails({ termId, onOpen, onBack, onRefreshProgress }) {
  const [term, setTerm] = useState(null);
  const [related, setRelated] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [ai, setAi] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTerm(null);
    setAi(null);
    setQuiz(null);
    setRelated([]);
    glossaryApi
      .getTerm(termId)
      .then((r) => setTerm(r.data))
      .catch(() => setError("Term not found"));
    glossaryApi
      .related(termId)
      .then((r) => setRelated(r.data))
      .catch(() => setRelated([]));
    glossaryApi
      .quiz(termId)
      .then((r) => setQuiz(r.data))
      .catch(() => setQuiz(null));
  }, [termId]);

  const askAI = async () => {
    setAiLoading(true);
    setAi(null);
    try {
      const r = await glossaryApi.explain(term.term, term.definition);
      setAi(r.data);
    } catch (e) {
      setError("Failed to load AI explanation.");
    } finally {
      setAiLoading(false);
    }
  };

  const exportPdf = async () => {
    try {
      const r = await glossaryApi.exportPdf(termId);
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${term.term.replace(/\s+/g, "_")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setError("PDF export failed.");
    }
  };

  const toggleFav = async () => {
    try {
      const r = await glossaryApi.toggleFavorite(termId);
      const favorited = r.data.favorited;
      setTerm((t) => ({ ...t, is_favorite: favorited }));
      onRefreshProgress && onRefreshProgress();
    } catch (e) {
      /* ignore */
    }
  };

  if (error && !term) {
    return (
      <div className="cs-gs-card">
        <p className="cs-gs-error">
          <AlertCircle size={15} />
          {error}
        </p>
        <button className="cs-gs-btn cs-gs-btn--ghost cs-gs-back" onClick={onBack}>
          <ArrowLeft size={17} />
          Back to glossary
        </button>
      </div>
    );
  }

  if (!term) {
    return (
      <div className="cs-gs-state">
        <div className="cs-gs-spinner" />
        Loading term…
      </div>
    );
  }

  return (
    <div className="cs-gs-detail">
      <button className="cs-gs-btn cs-gs-btn--ghost cs-gs-back" onClick={onBack}>
        <ArrowLeft size={17} />
        Back to glossary
      </button>

      <div className="cs-gs-card">
        <div className="cs-gs-detail__head">
          <div>
            <h1 className="cs-gs-detail__name">{term.term}</h1>
            <div className="cs-gs-detail__badges">
              <span className="cs-gs-badge cs-gs-badge--category">
                <BookOpen size={12} />
                {term.category}
              </span>
              {term.difficulty && (
                <span className="cs-gs-badge cs-gs-badge--neutral">{term.difficulty}</span>
              )}
            </div>
          </div>
          <button
            className={`cs-gs-fav ${term.is_favorite ? "cs-gs-fav--active" : ""}`}
            onClick={toggleFav}
            title={term.is_favorite ? "Remove favorite" : "Add favorite"}
          >
            <Star size={22} fill={term.is_favorite ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="cs-gs-section" style={{ paddingTop: "18px" }}>
          <span className="cs-gs-section__label">Definition</span>
          <div className="cs-gs-section__body">{term.definition}</div>
        </div>

        {term.example && (
          <div className="cs-gs-section">
            <span className="cs-gs-section__label">Example</span>
            <code className="cs-gs-code">{term.example}</code>
          </div>
        )}

        {term.prevention?.length > 0 && (
          <div className="cs-gs-section">
            <span className="cs-gs-section__label">Prevention</span>
            <ul className="cs-gs-list">
              {term.prevention.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        {term.owasp_reference && (
          <div className="cs-gs-section">
            <span className="cs-gs-section__label">OWASP Reference</span>
            <span className="cs-gs-owasp">
              <AlertCircle size={14} />
              {term.owasp_reference}
            </span>
          </div>
        )}

        <div className="cs-gs-actions">
          <button
            className="cs-gs-btn cs-gs-btn--primary"
            onClick={askAI}
            disabled={aiLoading}
          >
            <Bot size={18} />
            {aiLoading ? "Asking AI…" : "AI Explain"}
          </button>
          {quiz && (
            <a
              href="#cs-gs-quiz"
              className="cs-gs-btn cs-gs-btn--outline"
            >
              <FileQuestion size={18} />
              Take Mini Quiz
            </a>
          )}
          <button className="cs-gs-btn cs-gs-btn--outline" onClick={exportPdf}>
            <Download size={18} />
            Export PDF
          </button>
        </div>

        {ai && (
          <div className="cs-gs-ai-box">
            <div className="cs-gs-ai-box__head">
              <Sparkles size={16} color="var(--info, #3b82f6)" />
              AI Explanation
              <span className="cs-gs-ai-box__provider">via {ai.provider}</span>
            </div>
            <MarkdownRenderer content={ai.explanation} />
          </div>
        )}
      </div>

      {quiz && (
        <div className="cs-gs-card" id="cs-gs-quiz">
          <h3 className="cs-gs-section-title">
            <span className="cs-gs-icon-wrap">
              <FileQuestion size={17} />
            </span>
            Mini Quiz
          </h3>
          <div className="cs-gs-section-block">
            <MiniQuiz
              quiz={quiz}
              onComplete={(passed) => {
                if (passed) onRefreshProgress && onRefreshProgress();
              }}
            />
          </div>
        </div>
      )}

      <div className="cs-gs-card">
        <h3 className="cs-gs-section-title">
          <span className="cs-gs-icon-wrap">
            <BookOpen size={17} />
          </span>
          Related Terms
        </h3>
        <div className="cs-gs-section-block">
          <RelatedTerms terms={related} onOpen={onOpen} />
        </div>
      </div>
    </div>
  );
}