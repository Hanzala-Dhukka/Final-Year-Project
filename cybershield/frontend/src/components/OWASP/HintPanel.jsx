import { useState } from "react";
import { Lightbulb, HelpCircle } from "lucide-react";

/**
 * Hint panel (spec Step 10). Up to 3 progressive hints, one reveal at a time.
 * Reports hintsUsed via onHint. Awarding no-hint bonus when 0 used.
 */
export default function HintPanel({ hints = [], onHint }) {
  const [revealed, setRevealed] = useState(0);

  const reveal = () => {
    if (revealed < hints.length) {
      const next = revealed + 1;
      setRevealed(next);
      onHint && onHint(next);
    }
  };

  if (!hints || hints.length === 0) return null;

  return (
    <div className="cs-ow-hints">
      <div className="cs-ow-hints-head">
        <h4>
          <Lightbulb size={16} /> Hints ({revealed}/{hints.length})
        </h4>
        <button
          className="cs-ow-btn cs-ow-btn--ghost cs-ow-btn-sm"
          onClick={reveal}
          disabled={revealed >= hints.length}
        >
          <HelpCircle size={14} /> Reveal Hint
        </button>
      </div>
      <ul>
        {hints.slice(0, revealed).map((h, i) => (
          <li key={i}>
            <b>Hint {i + 1}.</b> {h}
          </li>
        ))}
      </ul>
      {revealed === 0 && (
        <p className="cs-ow-hint-note">Solve it without hints for a bonus!</p>
      )}
    </div>
  );
}