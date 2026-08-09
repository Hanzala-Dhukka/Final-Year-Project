import { useState, useEffect } from "react";
import {
  Brain, Gauge, Minus, Plus, ShieldCheck,
  Zap, Cpu, AlertCircle, ListChecks, Sparkles,
} from "lucide-react";
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
    <div className="cs-qz-row">
      <div className="cs-qz-main">
        <section className="cs-qz-card cs-qz-card--hero cs-qz-hero">
          <span className="cs-qz-hero-badge">
            <ShieldCheck size={14} />
            Adaptive Learning · AI Generated
          </span>
          <h2>Test yourself with AI-crafted questions</h2>
          <p>
            Pick a domain, stack and difficulty — the AI builds questions matched
            to your project, grades your answers instantly, and recommends what to
            review next.
          </p>
          <div className="cs-qz-hero__badges">
            <span className="cs-qz-badge cs-qz-badge--category">
              <Brain size={12} /> 16 categories
            </span>
            <span className="cs-qz-badge cs-qz-badge--tech">
              <Cpu size={12} /> 14 technologies
            </span>
            <span className="cs-qz-badge cs-qz-badge--category">
              <Gauge size={12} /> 4 difficulty levels
            </span>
          </div>
        </section>

        <div className="cs-qz-card">
          <h3 className="cs-qz-section-title">
            <span className="cs-qz-icon-wrap">
              <ListChecks size={17} />
            </span>
            Quiz Setup
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="cs-qz-field">
              <label>Difficulty</label>
              <DifficultySelector value={difficulty} onChange={setDifficulty} />
            </div>

            <CategorySelector
              category={category}
              technology={technology}
              onCategoryChange={setCategory}
              onTechnologyChange={setTechnology}
            />

            <div className="cs-qz-field">
              <label>Number of questions</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div className="cs-qz-stepper">
                  <button
                    className="cs-qz-step-btn"
                    onClick={() => setCount((c) => Math.max(1, Number(c) - 1))}
                    disabled={Number(count) <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="cs-qz-step-value">{count}</span>
                  <button
                    className="cs-qz-step-btn"
                    onClick={() => setCount((c) => Math.min(30, Number(c) + 1))}
                    disabled={Number(count) >= 30}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="cs-qz-count">max 30</span>
              </div>
            </div>

            {error && (
              <p className="cs-qz-error">
                <AlertCircle size={15} />
                {error}
              </p>
            )}

            <button
              className="cs-qz-btn cs-qz-btn--primary"
              style={{ width: "100%" }}
              onClick={start}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="cs-qz-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Generating with AI…
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Start Quiz
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <aside className="cs-qz-side">
        <div className="cs-qz-sticky">
          <div className="cs-qz-card">
            <h3 className="cs-qz-section-title">
              <span className="cs-qz-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--warning, #f59e0b)" }}>
                <Zap size={17} />
              </span>
              XP Leaderboard
            </h3>
            <Leaderboard entries={leaderboard} />
          </div>

          <div className="cs-qz-tip">
            <div className="cs-qz-tip__icon">
              <Sparkles size={16} />
            </div>
            <div className="cs-qz-tip-body">
              <h4>How it works</h4>
              <p>Generate → answer each question → get your score, XP and a ranked leaderboard instantly.</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}