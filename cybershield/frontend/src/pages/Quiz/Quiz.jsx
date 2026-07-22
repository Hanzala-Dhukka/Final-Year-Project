import { useState } from "react";
import QuizHome from "./QuizHome";
import QuizGame from "./QuizGame";
import QuizResult from "./QuizResult";

/**
 * AI Quiz Generator (Module 7.2) — top-level orchestrator.
 * Switches between the home (config), gameplay, and result screens.
 */
export default function Quiz() {
  const [view, setView] = useState("home"); // home | game | result
  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);

  const startQuiz = (generated) => {
    setQuiz(generated);
    setView("game");
  };

  const completeQuiz = (res) => {
    setResult(res);
    setView("result");
  };

  const backHome = () => {
    setQuiz(null);
    setResult(null);
    setView("home");
  };

  if (view === "game" && quiz) {
    return (
      <QuizGame
        quiz={quiz}
        onComplete={completeQuiz}
        onExit={backHome}
      />
    );
  }

  if (view === "result" && result) {
    return (
      <QuizResult result={result} onRetry={backHome} onHome={backHome} />
    );
  }

  return <QuizHome onStart={startQuiz} />;
}
