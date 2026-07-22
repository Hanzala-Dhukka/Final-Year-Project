import { useState, useEffect } from "react";
import quizApi from "../../api/quizApi";
import DifficultySelector from "../../components/Quiz/DifficultySelector";
import CategorySelector from "../../components/Quiz/CategorySelector";
import Leaderboard from "../../components/Quiz/Leaderboard";

/**
 * Quiz home screen (spec Step 13).
 * Lets the user pick difficulty / category / technology / question count and
 * start an AI-generated quiz, plus shows the live XP leaderboard.
 */
export default function QuizHome({ onStart }) {
  const [difficulty, setDifficulty] = useState("Medium");
  const [category, setCategory] = useState("OWASP Top 10");
  const [technology, setTechnology] = useState("FastAPI");
  const [count, setCount] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    quizApi
      .getLeaderboard(10)
      .then((r) => setLeaderboard(r.data || []))
      .catch(() => setLeaderboard([]));
  }, []);

  const start = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await quizApi.generate({
        difficulty,
        category,
        technology,
        count: Number(count),
      });
      onStart && onStart(res.data);
    } catch (e) {
      setError(
        e.response?.data?.detail || "Failed to generate quiz. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">🛡️ CyberShield AI Quiz</h1>
      <p className="text-gray-500 mb-6">
        Generate project- and technology-aware cybersecurity questions with AI.
      </p>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Difficulty
          </label>
          <DifficultySelector value={difficulty} onChange={setDifficulty} />
        </div>

        <CategorySelector
          category={category}
          technology={technology}
          onCategoryChange={setCategory}
          onTechnologyChange={setTechnology}
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Questions
          </label>
          <input
            type="number"
            min={1}
            max={30}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 w-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded">{error}</p>
        )}

        <button
          onClick={start}
          disabled={loading}
          className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Generating with AI…" : "Start Quiz"}
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3">🏆 Leaderboard</h2>
        <Leaderboard entries={leaderboard} />
      </div>
    </div>
  );
}
