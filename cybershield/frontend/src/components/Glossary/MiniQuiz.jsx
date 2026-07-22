import { useState } from "react";

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
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="font-semibold text-gray-800 mb-3">📝 Mini Quiz</h3>
      <p className="text-gray-700 mb-4">{quiz.question}</p>

      <div className="space-y-2">
        {quiz.options.map((opt, i) => {
          let cls = "border-gray-200 hover:border-blue-400 text-gray-700";
          if (done) {
            if (opt === quiz.correct_answer)
              cls = "border-green-500 bg-green-50 text-green-700";
            else if (opt === selected)
              cls = "border-red-500 bg-red-50 text-red-600";
            else cls = "border-gray-200 text-gray-400";
          } else if (selected === opt) {
            cls = "border-blue-600 bg-blue-50 text-blue-700";
          }
          return (
            <button
              key={i}
              disabled={done}
              onClick={() => setSelected(opt)}
              className={`w-full text-left px-4 py-2.5 rounded-lg border transition ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {!done && (
        <button
          onClick={submit}
          disabled={selected == null}
          className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Check Answer
        </button>
      )}

      {done && (
        <div className="mt-4 text-sm">
          <p className={`font-semibold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
            {isCorrect ? "✅ Correct!" : `❌ Correct answer: ${quiz.correct_answer}`}
          </p>
          <p className="text-gray-600 mt-1">{quiz.explanation}</p>
        </div>
      )}
    </div>
  );
}
