import { useState } from "react";
import { BookOpen, Check, RefreshCw, RotateCw } from "lucide-react";

/**
 * Flashcard with 3D flip animation (spec Step 8).
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
    <div>
      <div className={`cs-gs-flash ${flipped ? "cs-gs-flash--back" : ""}`}>
        <div
          className={`cs-gs-flash__inner ${flipped ? "cs-gs-flash__inner--flipped" : ""}`}
          onClick={flip}
        >
          <div className="cs-gs-flash__face cs-gs-flash__front">
            <span className="cs-gs-badge cs-gs-badge--category">
              <BookOpen size={11} />
              {card.category}
            </span>
            <h2 className="cs-gs-flash__name">{card.term}</h2>
            {card.difficulty && (
              <span className="cs-gs-badge cs-gs-badge--neutral">{card.difficulty}</span>
            )}
            <span className="cs-gs-flash__hint">
              <RotateCw size={13} />
              Click to flip
            </span>
          </div>

          <div className="cs-gs-flash__face cs-gs-flash__back">
            <div style={{ fontSize: "0.88rem", color: "var(--text-primary, #f1f5f9)", lineHeight: 1.6 }}>
              <p style={{ margin: "0 0 10px" }}>
                <strong>Definition: </strong>
                {card.definition}
              </p>
              {card.example && (
                <p style={{ margin: "0 0 10px" }}>
                  <strong>Example: </strong>
                  <code className="cs-gs-code">{card.example}</code>
                </p>
              )}
              {card.prevention?.length > 0 && (
                <p style={{ margin: "0 0 10px" }}>
                  <strong>Prevention: </strong>
                  {card.prevention.join(", ")}
                </p>
              )}
              {card.owasp_reference && (
                <p style={{ margin: "0 0 10px" }}>
                  <strong>OWASP: </strong>
                  <span style={{ color: "var(--danger, #ef4444)" }}>{card.owasp_reference}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {flipped && !answered && (
        <div className="cs-gs-knobs">
          <button className="cs-gs-knob cs-gs-knob--known" onClick={() => choose("known")}>
            <Check size={18} />
            I know it
          </button>
          <button className="cs-gs-knob cs-gs-knob--learning" onClick={() => choose("learning")}>
            <RefreshCw size={18} />
            Still learning
          </button>
        </div>
      )}

      {answered && (
        <p className="cs-gs-answered-note">
          {answered === "known" ? (
            <>
              <Check size={15} style={{ color: "var(--success, #10b981)" }} />
              Marked as known
            </>
          ) : (
            <>
              <RefreshCw size={15} style={{ color: "var(--warning, #f59e0b)" }} />
              Keep practicing
            </>
          )}
        </p>
      )}
    </div>
  );
}