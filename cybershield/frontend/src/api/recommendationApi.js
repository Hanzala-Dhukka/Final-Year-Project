import API from "./api";

// Scanner → Checklist Recommendations API (Module SC3)
export const recommendationApi = {
  // POST /api/v1/recommendations/{projectId}/generate
  generate: (projectId, scanId) =>
    API.post(`/recommendations/${projectId}/generate`, { scan_id: scanId }),

  // GET /api/v1/recommendations/{projectId}
  list: (projectId, scanId = null) =>
    API.get(`/recommendations/${projectId}`, {
      params: scanId ? { scan_id: scanId } : {},
    }),

  // GET /api/v1/recommendations/{projectId}/stats
  stats: (projectId) =>
    API.get(`/recommendations/${projectId}/stats`),
};

export default recommendationApi;
