import { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, Check } from "lucide-react";
import glossaryApi from "../../api/glossaryApi";
import Flashcard from "../../components/Glossary/Flashcard";

/**
 * Flashcard study mode (spec Steps 8-9). Builds a session from the glossary and
 * tracks known / learning / completed counts; persists the result on finish.
 */
export default function Flashcards({ onBack, onRefreshProgress }) {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [known, setKnown] = useState(0);
  const [learning, setLearning] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    glossaryApi
      .createFlashcards({ limit: 20 })
      .then((r) => setCards(r.data.terms || []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, []);

  const handleResult = (kind) => {
    if (kind === "known") setKnown((k) => k + 1);
    else setLearning((l) => l + 1);

    // Move to next after a short delay
    setTimeout(() => {
      if (index < cards.length - 1) setIndex((i) => i + 1);
      else finish();
    }, 600);
  };

  const finish = async () => {
    const completed = known + learning + 1;
    try {
      await glossaryApi.flashcardResult({
        known,
        learning,
        completed,
        term_ids: cards.map((c) => c.id),
      });
      onRefreshProgress && onRefreshProgress();
    } catch (e) {
      /* ignore */
    }
    setFinished(true);
  };

  if (loading) {
    return (
      <div className="cs-gs-deck">
        <div className="cs-gs-state">
          <div className="cs-gs-spinner" />
          Building your deck…
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="cs-gs-card cs-gs-complete">
        <div className="cs-gs-complete__icon">
          <Check size={36} />
        </div>
        <h2>Session Complete</h2>
        <p>Great work — you reviewed {cards.length} terms.</p>
        <div className="cs-gs-complete__stats">
          <div className="cs-gs-complete__stat">
            <b style={{ color: "var(--success, #10b981)" }}>{known}</b>
            <span>Known</span>
          </div>
          <div className="cs-gs-complete__stat">
            <b style={{ color: "var(--warning, #f59e0b)" }}>{learning}</b>
            <span>Learning</span>
          </div>
        </div>
        <button className="cs-gs-btn cs-gs-btn--primary" onClick={onBack}>
          <BookOpen size={17} />
          Back to Glossary
        </button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="cs-gs-deck">
        <div className="cs-gs-state">
          <BookOpen size={28} />
          No flashcards available.
        </div>
        <button className="cs-gs-btn cs-gs-btn--ghost cs-gs-back" onClick={onBack}>
          <ArrowLeft size={17} />
          Back to glossary
        </button>
      </div>
    );
  }

  return (
    <div className="cs-gs-deck">
      <div className="cs-gs-deck__top">
        <button className="cs-gs-btn cs-gs-btn--ghost cs-gs-back" onClick={onBack}>
          <ArrowLeft size={17} />
          Exit
        </button>
        <span className="cs-gs-deck__counter">
          Card <strong>{index + 1}</strong> / {cards.length}
        </span>
      </div>
      <Flashcard card={cards[index]} onResult={handleResult} />
    </div>
  );
}