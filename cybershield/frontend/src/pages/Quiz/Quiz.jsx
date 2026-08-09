import { useState, useCallback } from "react";
import { Brain, Sun, Moon, Sparkles } from "lucide-react";
import { useTheme } from "../../theme/useTheme";
import QuizHome from "./QuizHome";
import QuizGame from "./QuizGame";
import QuizResult from "./QuizResult";
import "./Quiz.css";

/**
 * AI Quiz Generator (Module 7.2) — top-level orchestrator.
 * Switches between the home (config), gameplay, and result screens with a
 * shared professional header + theme toggle.
 */
export default function Quiz() {
  const [view, setView] = useState("home"); // home | game | result
  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const { isDark, toggleTheme } = useTheme();

  const startQuiz = useCallback((generated) => {
    setQuiz(generated);
    setView("game");
    window.scrollTo(0, 0);
  }, []);

  const completeQuiz = useCallback((res) => {
    setResult(res);
    setView("result");
    window.scrollTo(0, 0);
  }, []);

  const backHome = useCallback(() => {
    setQuiz(null);
    setResult(null);
    setView("home");
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="cs-qz-wrap">
      <header className="cs-qz-header">
        <div className="cs-qz-brand">
          <div className="cs-qz-logo">
            <Brain size={23} />
          </div>
          <div>
            <h1>
              CyberShield <span className="cs-qz-grad">AI Quiz</span>
            </h1>
            <p className="subtitle">Generate smart, tech-aware security quizzes</p>
          </div>
        </div>

        <div className="cs-qz-header-spacer" />

        <span className="cs-qz-hero-badge">
          <Sparkles size={13} />
          Powered by AI
        </span>

        <button
          className="cs-qz-icon-btn"
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {view === "game" && quiz ? (
        <QuizGame quiz={quiz} onComplete={completeQuiz} onExit={backHome} />
      ) : view === "result" && result ? (
        <QuizResult result={result} onRetry={backHome} onHome={backHome} />
      ) : (
        <QuizHome onStart={startQuiz} />
      )}
    </div>
  );
}