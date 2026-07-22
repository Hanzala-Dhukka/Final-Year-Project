import { useState, useEffect } from "react";
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
      <div className="container mx-auto px-4 py-8 max-w-2xl text-gray-400">Building deck…</div>
    );
  }

  if (finished) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">🎉 Session Complete</h2>
          <p className="text-gray-600">
            Known: <span className="text-green-600 font-semibold">{known}</span> ·{" "}
            Learning: <span className="text-yellow-500 font-semibold">{learning}</span>
          </p>
          <button
            onClick={onBack}
            className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Glossary
          </button>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <p className="text-gray-400">No flashcards available.</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600">
          ← Exit
        </button>
        <span className="text-sm text-gray-500">
          Card {index + 1} / {cards.length}
        </span>
      </div>
      <Flashcard card={cards[index]} onResult={handleResult} />
    </div>
  );
}
