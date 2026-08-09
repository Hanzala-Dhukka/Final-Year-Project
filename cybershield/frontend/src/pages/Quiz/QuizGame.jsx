import { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, Send, AlertCircle } from "lucide-react";
import quizApi from "../../api/quizApi";
import QuestionCard from "../../components/Quiz/QuestionCard";
import Timer from "../../components/Quiz/Timer";
import ProgressBar from "../../components/Quiz/ProgressBar";

/**
 * Quiz gameplay screen (spec Step 14).
 * Shows one question at a time with a countdown, progress bar, and a single
 * selectable answer per question. Submits all answers on finish.
 */
export default function QuizGame({ quiz, onComplete, onExit }) {
  const questions = quiz.questions || [];
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // index(str) -> option text
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const select = (opt) => {
    setAnswers((prev) => ({ ...prev, [current]: opt }));
  };

  const next = () => {
    if (current < questions.length - 1) setCurrent((c) => c + 1);
  };
  const prev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const answeredCount = Object.keys(answers).length;

  const finish = useCallback(async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await quizApi.submit(quiz.session_id, answers);
      onComplete && onComplete(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to submit quiz.");
      setSubmitting(false);
    }
  }, [answers, quiz.session_id, onComplete]);

  const onExpire = useCallback(() => {
    if (!submitting) finish();
  }, [finish, submitting]);

  const q = questions[current];

  return (
    <div className="cs-qz-game">
      <div className="cs-qz-game__top">
        <button className="cs-qz-btn cs-qz-btn--ghost cs-qz-back" onClick={onExit}>
          <ArrowLeft size={17} />
          Exit
        </button>
        <Timer durationSec={600} onExpire={onExpire} running={!submitting} />
      </div>

      <ProgressBar current={current} total={questions.length} />

      {q ? (
        <QuestionCard
          index={current}
          question={q}
          selected={answers[current]}
          onSelect={select}
        />
      ) : (
        <div className="cs-qz-state">
          <div className="cs-qz-spinner" />
          Preparing quiz…
        </div>
      )}

      <div className="cs-qz-nav">
        <button
          className="cs-qz-btn cs-qz-btn--outline"
          onClick={prev}
          disabled={current === 0}
        >
          Previous
        </button>

        <span className="cs-qz-count">
          <strong>{answeredCount}</strong> / {questions.length} answered
        </span>

        {current < questions.length - 1 ? (
          <button className="cs-qz-btn cs-qz-btn--primary" onClick={next}>
            Next
          </button>
        ) : (
          <button
            className="cs-qz-btn cs-qz-btn--success"
            onClick={finish}
            disabled={submitting || answeredCount < questions.length}
          >
            <Send size={16} />
            {submitting ? "Submitting…" : "Submit Quiz"}
          </button>
        )}
      </div>

      {error && (
        <p className="cs-qz-error">
          <AlertCircle size={15} />
          {error}
        </p>
      )}
    </div>
  );
}