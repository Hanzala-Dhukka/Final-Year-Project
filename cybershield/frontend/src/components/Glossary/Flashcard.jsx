import { useState } from "react";

/**
 * Flashcard with flip animation (spec Step 8).
 * Front shows the term; back shows definition, example, prevention, OWASP,
 * difficulty. onResult reports 'known' or 'learning' after flipping.
 */
export default function Flashcard({ card, onResult }) {
  const [flipped, setFlipped] = useState(false);
  const [answered, setAnswered] = useState(null);

  const flip = () => {
    if (!answered) setFlipped((f) => !f);
  };

  const choose = (kind) => {
    setAnswered(kind);
    onResult && onResult(kind);
  };

  return (
    <div className="w-full">
      <div
        onClick={flip}
        className={`min-h-[220px] rounded-xl shadow p-6 cursor-pointer transition-transform ${
          flipped ? "bg-blue-50 border border-blue-200" : "bg-white border border-gray-200"
        }`}
      >
        {!flipped ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-xs text-gray-400 mb-2">{card.category}</span>
            <h2 className="text-2xl font-bold text-gray-800">{card.term}</h2>
            <p className="text-sm text-gray-400 mt-4">Click to flip</p>
          </div>
        ) : (
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <span className="font-semibold">Definition: </span>
              {card.definition}
            </p>
            {card.example && (
              <p>
                <span className="font-semibold">Example: </span>
                <code className="bg-gray-100 px-1 rounded">{card.example}</code>
              </p>
            )}
            {card.prevention?.length > 0 && (
              <p>
                <span className="font-semibold">Prevention: </span>
                {card.prevention.join(", ")}
              </p>
            )}
            {card.owasp_reference && (
              <p>
                <span className="font-semibold">OWASP: </span>
                {card.owasp_reference}
              </p>
            )}
            {card.difficulty && (
              <p>
                <span className="font-semibold">Difficulty: </span>
                {card.difficulty}
              </p>
            )}
          </div>
        )}
      </div>

      {flipped && !answered && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => choose("known")}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            I know it
          </button>
          <button
            onClick={() => choose("learning")}
            className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
          >
            Still learning
          </button>
        </div>
      )}
      {answered && (
        <p className="text-center text-sm text-gray-500 mt-3">
          {answered === "known" ? "Marked as known ✅" : "Keep practicing 📚"}
        </p>
      )}
    </div>
  );
}
