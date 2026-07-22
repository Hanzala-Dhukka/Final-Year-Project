import { useState, useEffect } from "react";
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
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <p className="text-red-500">{error}</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">
          ← Back to glossary
        </button>
      </div>
    );
  }

  if (!term) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl text-gray-400">Loading…</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 mb-4">
        ← Back to glossary
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{term.term}</h1>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                {term.category}
              </span>
              {term.difficulty && (
                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                  {term.difficulty}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={toggleFav}
            className={`text-3xl ${term.is_favorite ? "text-yellow-400" : "text-gray-300 hover:text-yellow-400"}`}
            title="Toggle favorite"
          >
            ★
          </button>
        </div>

        <Section title="Definition">{term.definition}</Section>

        {term.example && (
          <Section title="Example">
            <code className="block bg-gray-100 rounded p-3 text-sm overflow-x-auto">
              {term.example}
            </code>
          </Section>
        )}

        {term.prevention?.length > 0 && (
          <Section title="Prevention">
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {term.prevention.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </Section>
        )}

        {term.owasp_reference && (
          <Section title="OWASP Reference">
            <span className="text-red-600 font-semibold">{term.owasp_reference}</span>
          </Section>
        )}

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={askAI}
            disabled={aiLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {aiLoading ? "Asking AI…" : "🤖 AI Explain"}
          </button>
          {quiz && (
            <button
              onClick={() => setQuiz((q) => ({ ...q }))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              📝 Take Mini Quiz
            </button>
          )}
          <button
            onClick={exportPdf}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            ⬇ Export PDF
          </button>
        </div>

        {ai && (
          <div className="mt-5 border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-2">AI Explanation</h3>
            <MarkdownRenderer content={ai.explanation} />
            <p className="text-xs text-gray-400 mt-2">via {ai.provider}</p>
          </div>
        )}
      </div>

      {quiz && (
        <div className="mt-5">
          <MiniQuiz
            quiz={quiz}
            onComplete={(passed) => {
              if (passed) onRefreshProgress && onRefreshProgress();
            }}
          />
        </div>
      )}

      <div className="mt-5 bg-white rounded-lg shadow p-5">
        <h3 className="font-semibold text-gray-800 mb-3">🔗 Related Terms</h3>
        <RelatedTerms terms={related} onOpen={onOpen} />
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        {title}
      </h3>
      <div className="mt-1 text-gray-700">{children}</div>
    </div>
  );
}
