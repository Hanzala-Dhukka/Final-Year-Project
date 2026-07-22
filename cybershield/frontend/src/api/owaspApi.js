import API from "./api";

// OWASP Simulator API (Module 7.4) — mounted under /api/v1/owasp
export const owaspApi = {
  labs: () => API.get("/owasp/labs"),
  start: (payload) => API.post("/owasp/start", payload),
  attack: (payload) => API.post("/owasp/attack", payload),
  defense: (payload) => API.post("/owasp/defense", payload),
  coach: (payload) => API.post("/owasp/coach", payload),
  daily: () => API.get("/owasp/daily"),
  completeDaily: () => API.post("/owasp/daily/complete"),
  history: () => API.get("/owasp/history"),
  progress: () => API.get("/owasp/progress"),
};

// Spec Step 4 vulnerabilities
export const OWASP_VULNERABILITIES = [
  "SQL Injection",
  "XSS",
  "Command Injection",
  "Path Traversal",
  "Broken Authentication",
  "CSRF",
  "SSRF",
  "IDOR",
  "File Upload",
  "XXE",
  "Security Misconfiguration",
  "Insecure Deserialization",
  "JWT Attacks",
  "API Security",
  "Rate Limiting",
];

export const OWASP_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Expert"];

export default owaspApi;
