import { useState, useEffect } from "react";
import quizApi from "../../api/quizApi";
import ScoreCard from "../../components/Quiz/ScoreCard";
import Leaderboard from "../../components/Quiz/Leaderboard";
import MarkdownRenderer from "../../components/AIAssistant/MarkdownRenderer";

/**
 * Quiz result screen (spec Steps 15 & 16).
 * Shows score, XP, rank, per-question AI feedback, recommendations, and the
 * refreshed leaderboard.
 */
export default function QuizResult({ result, onRetry, onHome }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    quizApi
      .getLeaderboard(10)
      .then((r) => setLeaderboard(r.data || []))
      .catch(() => setLeaderboard([]));
  }, []);

  const results = result.results || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Complete</h1>

      <ScoreCard
        score={result.score}
        total={result.total}
        percentage={result.percentage}
        xp={result.xp}
        rank={result.rank}
      />

      {/* AI recommendations (adaptive learning, Step 17) */}
      {result.recommendations?.length > 0 && (
        <div className="bg-white shadow rounded-lg p-5 mt-5">
          <h2 className="text-lg font-semibold mb-2">💡 AI Recommendations</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {result.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Per-question AI feedback (Step 16) */}
      <div className="bg-white shadow rounded-lg p-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Review Answers</h2>
          <button
            onClick={() => setShowAnswers((s) => !s)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showAnswers ? "Hide" : "Show"} explanations
          </button>
        </div>

        {results.map((r, i) => {
          const correct = r.is_correct;
          return (
            <div
              key={i}
              className={`border rounded-lg p-3 mb-3 ${
                correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
              }`}
            >
              <p className="font-medium text-gray-800 mb-1">
                {i + 1}. {r.question}
              </p>
              <p className="text-sm">
                <span className="text-gray-500">Your answer: </span>
                <span className={correct ? "text-green-700" : "text-red-600"}>
                  {r.user_answer || "—"}
                </span>
              </p>
              {!correct && (
                <p className="text-sm">
                  <span className="text-gray-500">Correct answer: </span>
                  <span className="text-green-700">{r.correct_answer}</span>
                </p>
              )}
              {showAnswers && (
                <div className="mt-2 text-sm text-gray-700 space-y-1">
                  {r.explanation && (
                    <div>
                      <span className="font-semibold">Reason: </span>
                      <MarkdownRenderer content={r.explanation} />
                    </div>
                  )}
                  {r.owasp_reference && (
                    <p>
                      <span className="font-semibold">OWASP: </span>
                      {r.owasp_reference}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white shadow rounded-lg p-5 mt-5">
        <h2 className="text-lg font-semibold mb-3">🏆 Leaderboard</h2>
        <Leaderboard entries={leaderboard} />
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onRetry}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          New Quiz
        </button>
        <button
          onClick={onHome}
          className="px-5 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
