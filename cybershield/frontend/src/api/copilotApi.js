import API from "./api";

// AI Security Copilot API (Module 5.5)
// Mounted under /api/v1/copilot

export const copilotApi = {
  // Generate a full security assessment
  analyze: (projectId = null, question = null) =>
    API.post("/copilot/analyze", { project_id: projectId, question }),

  // Natural-language security query
  chat: (question, projectId = null) =>
    API.post("/copilot/chat", { question, project_id: projectId }),

  // Get a stored advisory
  getReport: (advisoryId) => API.get(`/copilot/report/${advisoryId}`),

  // List previous advisories
  history: () => API.get("/copilot/history"),

  // Security score + breakdown
  score: (projectId) => API.get(`/copilot/score/${projectId}`),
};

export default copilotApi;
