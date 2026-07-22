import { useState, useCallback } from "react";
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
    } finally {
      setSubmitting(false);
    }
  }, [answers, quiz.session_id, onComplete]);

  const onExpire = useCallback(() => {
    // Auto-submit when the timer runs out
    finish();
  }, [finish]);

  const q = questions[current];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <Timer durationSec={600} onExpire={onExpire} running={!submitting} />
        <button
          onClick={onExit}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Exit
        </button>
      </div>

      <div className="mb-4">
        <ProgressBar current={current} total={questions.length} />
      </div>

      {q && (
        <QuestionCard
          index={current}
          question={q}
          selected={answers[current]}
          onSelect={select}
        />
      )}

      <div className="flex items-center justify-between mt-5">
        <button
          onClick={prev}
          disabled={current === 0}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-40"
        >
          Previous
        </button>

        {current < questions.length - 1 ? (
          <button
            onClick={next}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={submitting || answeredCount < questions.length}
            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Quiz"}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded mt-4">{error}</p>
      )}
    </div>
  );
}
