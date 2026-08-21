import API from "./api";

// Gamification API (Module 7.5) — mounted under /api/v1/gamification
export const gamificationApi = {
  progress: () => API.get("/gamification/progress"),
  leaderboard: (limit = 20) => API.get(`/gamification/leaderboard?limit=${limit}`),
  achievements: () => API.get("/gamification/achievements"),
  badges: () => API.get("/gamification/badges"),
  certificates: () => API.get("/gamification/certificates"),
  allCertificates: () => API.get("/gamification/certificates/all"),
  downloadCertificate: (id) =>
    API.get(`/gamification/certificate/${id}/download`, { responseType: "blob" }),
  checkCategoryCert: (vulnType) =>
    API.get(`/gamification/certificate/category/${encodeURIComponent(vulnType)}/check`),
  generateCategoryCert: (vulnType) =>
    API.post(`/gamification/certificate/category/${encodeURIComponent(vulnType)}/generate`),
  checkProfessionalCert: () =>
    API.get("/gamification/certificate/professional/check"),
  generateProfessionalCert: () =>
    API.post("/gamification/certificate/professional/generate"),
  activity: (limit = 30) => API.get(`/gamification/activity?limit=${limit}`),
  goals: () => API.get("/gamification/goals"),
  createGoal: (payload) => API.post("/gamification/goals", payload),
  deleteGoal: (id) => API.delete(`/gamification/goals/${id}`),
};

export default gamificationApi;
