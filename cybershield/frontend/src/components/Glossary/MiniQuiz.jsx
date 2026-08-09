import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

/**
 * Mini quiz for a glossary term (spec Step 10). Shows a single multiple-choice
 * question, reveals the correct answer + explanation after answering, and
 * reports the outcome via onComplete.
 */
export default function MiniQuiz({ quiz, onComplete }) {
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);

  if (!quiz) return null;

  const isCorrect = selected === quiz.correct_answer;

  const submit = () => {
    if (selected == null) return;
    setDone(true);
    onComplete && onComplete(isCorrect);
  };

  return (
    <div className="cs-gs-quiz">
      <p className="cs-gs-quiz__question">{quiz.question}</p>

      {quiz.options.map((opt, i) => {
        let cls = "";
        if (done) {
          if (opt === quiz.correct_answer) cls = "cs-gs-option--correct";
          else if (opt === selected) cls = "cs-gs-option--wrong";
        } else if (selected === opt) {
          cls = "cs-gs-option--selected";
        }
        return (
          <button
            key={i}
            className={`cs-gs-option ${cls}`}
            disabled={done}
            onClick={() => setSelected(opt)}
          >
            {opt}
          </button>
        );
      })}

      {!done ? (
        <button
          className="cs-gs-btn cs-gs-btn--primary"
          style={{ width: "100%" }}
          onClick={submit}
          disabled={selected == null}
        >
          Check Answer
        </button>
      ) : (
        <div className={`cs-gs-quiz-result ${isCorrect ? "cs-gs-quiz-result--pass" : "cs-gs-quiz-result--fail"}`}>
          {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <div>
            <strong>{isCorrect ? "Correct!" : `Correct answer: ${quiz.correct_answer}`}</strong>
            <div style={{ marginTop: 3, fontSize: "0.82rem", opacity: 0.9 }}>
              {quiz.explanation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}