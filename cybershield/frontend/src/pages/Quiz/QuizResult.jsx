import { useState, useEffect } from "react";
import {
  Check, X, RotateCcw, Home, Lightbulb, Eye, EyeOff,
  ShieldAlert, Trophy, Sparkles,
} from "lucide-react";
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
    <div className="cs-qz-result">
      <ScoreCard
        score={result.score}
        total={result.total}
        percentage={result.percentage}
        xp={result.xp}
        rank={result.rank}
        correct={result.correct}
      />

      {result.recommendations?.length > 0 && (
        <div className="cs-qz-card">
          <h3 className="cs-qz-section-title">
            <span className="cs-qz-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--warning, #f59e0b)" }}>
              <Lightbulb size={17} />
            </span>
            AI Recommendations
          </h3>
          <div className="cs-qz-recs">
            {result.recommendations.map((r, i) => (
              <div key={i} className="cs-qz-rec">
                <span className="cs-qz-rec__icon">
                  <Sparkles size={14} />
                </span>
                {r}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="cs-qz-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <h3 className="cs-qz-section-title" style={{ margin: 0 }}>
            <span className="cs-qz-icon-wrap">
              <Eye size={17} />
            </span>
            Review Answers
          </h3>
          <button
            className="cs-qz-btn cs-qz-btn--outline cs-qz-btn--sm"
            onClick={() => setShowAnswers((s) => !s)}
          >
            {showAnswers ? <EyeOff size={15} /> : <Eye size={15} />}
            {showAnswers ? "Hide explanations" : "Show explanations"}
          </button>
        </div>

        <div className="cs-qz-review" style={{ marginTop: 16 }}>
          {results.map((r, i) => {
            const correct = r.is_correct;
            return (
              <div key={i} className="cs-qz-review__item">
                <div className={`cs-qz-review__head ${correct ? "cs-qz-review__head--correct" : "cs-qz-review__head--wrong"}`}>
                  <span className={`cs-qz-review__marker ${correct ? "cs-qz-review__marker--correct" : "cs-qz-review__marker--wrong"}`}>
                    {correct ? <Check size={14} /> : <X size={14} />}
                  </span>
                  <span>{i + 1}. {r.question}</span>
                </div>

                <div className="cs-qz-review__body">
                  <p className="cs-qz-review__answer" style={{ margin: 0 }}>
                    <strong>Your answer: </strong>
                    <span className={correct ? "cs-qz-review__answer--good" : "cs-qz-review__answer--bad"}>
                      {r.user_answer || "—"}
                    </span>
                  </p>

                  {!correct && (
                    <p className="cs-qz-review__answer" style={{ margin: 0 }}>
                      <strong>Correct answer: </strong>
                      <span className="cs-qz-review__answer--good">{r.correct_answer}</span>
                    </p>
                  )}

                  {r.owasp_reference && (
                    <span className="cs-qz-owasp">
                      <ShieldAlert size={12} />
                      {r.owasp_reference}
                    </span>
                  )}

                  {showAnswers && (
                    <div className="cs-qz-review__detail">
                      {r.explanation && (
                        <MarkdownRenderer content={r.explanation} />
                      )}
                      {!r.explanation && !r.owasp_reference && (
                        <span>No extra explanation for this question.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cs-qz-card">
        <h3 className="cs-qz-section-title">
          <span className="cs-qz-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--warning, #f59e0b)" }}>
            <Trophy size={17} />
          </span>
          Leaderboard
        </h3>
        <Leaderboard entries={leaderboard} />
      </div>

      <div className="cs-qz-result__actions">
        <button className="cs-qz-btn cs-qz-btn--primary" onClick={onRetry}>
          <RotateCcw size={17} />
          New Quiz
        </button>
        <button className="cs-qz-btn cs-qz-btn--outline" onClick={onHome}>
          <Home size={17} />
          Back to Home
        </button>
      </div>
    </div>
  );
}