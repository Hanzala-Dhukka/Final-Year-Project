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

  // Mode-specific certificate endpoints
  checkModeCompletion: (mode) => API.get(`/gamification/certificate/mode/${mode}/check`),
  listModeCertificates: (mode) => API.get(`/gamification/certificate/mode/${mode}/list`),
  generateModeVulnCert: (mode, vulnType) =>
    API.post(`/gamification/certificate/mode/${mode}/${encodeURIComponent(vulnType)}/generate`),
  generateModeProfessionalCert: (mode) =>
    API.post(`/gamification/certificate/mode/${mode}/generate`),

  // Legacy certificate endpoints
  certificates: () => API.get("/gamification/certificates"),
  allCertificates: () => API.get("/gamification/certificates/all"),
  checkProfessionalCert: () => API.get("/gamification/certificate/professional/check"),
  generateProfessionalCert: () => API.post("/gamification/certificate/professional/generate"),
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
