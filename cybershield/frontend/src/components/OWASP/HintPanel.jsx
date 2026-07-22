import { useState } from "react";

/**
 * Hint panel (spec Step 10). Up to 3 progressive hints, one reveal at a time.
 * Reports hintsUsed via onHint. Awarding no-hint bonus when 0 used.
 */
export default function HintPanel({ hints = [], onHint }) {
  const [revealed, setRevealed] = useState(0);

  const reveal = () => {
    if (revealed < hints.length) {
      setRevealed((r) => r + 1);
      onHint && onHint(revealed + 1);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-yellow-800">💡 Hints ({revealed}/{hints.length})</h3>
        <button
          onClick={reveal}
          disabled={revealed >= hints.length}
          className="text-xs px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-40"
        >
          Reveal Hint
        </button>
      </div>
      <ul className="mt-2 space-y-1 list-decimal list-inside text-sm text-yellow-900">
        {hints.slice(0, revealed).map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>
      {revealed === 0 && (
        <p className="text-xs text-yellow-700 mt-1">Solve without hints for a bonus!</p>
      )}
    </div>
  );
}
