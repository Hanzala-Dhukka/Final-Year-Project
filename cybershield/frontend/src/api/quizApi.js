import API from "./api";

// AI Quiz Generator API (Module 7.2)
// All endpoints are mounted under /api/v1/quiz

export const quizApi = {
  // Generate an AI quiz session
  generate: (payload) => API.post("/quiz/generate", payload),

  // Get a quiz session's questions (answers hidden)
  getQuiz: (sessionId) => API.get(`/quiz/${sessionId}`),

  // Submit answers
  submit: (sessionId, answers) =>
    API.post("/quiz/submit", { session_id: sessionId, answers }),

  // List the user's quiz attempts
  getHistory: () => API.get("/quiz/history"),

  // Global XP leaderboard
  getLeaderboard: (limit = 20, skip = 0) =>
    API.get(`/quiz/leaderboard?limit=${limit}&skip=${skip}`),
};

// Quiz configuration constants (spec Steps 7-9)
export const QUIZ_DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"];

export const QUIZ_CATEGORIES = [
  "OWASP Top 10",
  "Threat Modeling",
  "Authentication",
  "Authorization",
  "Cryptography",
  "Networking",
  "Cloud Security",
  "API Security",
  "React Security",
  "FastAPI Security",
  "MongoDB Security",
  "DevSecOps",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "GitHub Security",
];

export const QUIZ_TECHNOLOGIES = [
  "FastAPI",
  "React",
  "MongoDB",
  "Docker",
  "GitHub",
  "JWT",
  "OAuth",
  "Python",
  "JavaScript",
  "NodeJS",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
];

export default quizApi;
