import API from "./api";

// Gamification API (Module 7.5) — mounted under /api/v1/gamification
export const gamificationApi = {
  progress: () => API.get("/gamification/progress"),
  leaderboard: (limit = 20) => API.get(`/gamification/leaderboard?limit=${limit}`),
  achievements: () => API.get("/gamification/achievements"),
  badges: () => API.get("/gamification/badges"),
  certificates: () => API.get("/gamification/certificates"),
  downloadCertificate: (id) =>
    API.get(`/gamification/certificate/${id}/download`, { responseType: "blob" }),
  activity: (limit = 30) => API.get(`/gamification/activity?limit=${limit}`),
  goals: () => API.get("/gamification/goals"),
  createGoal: (payload) => API.post("/gamification/goals", payload),
};

export default gamificationApi;
