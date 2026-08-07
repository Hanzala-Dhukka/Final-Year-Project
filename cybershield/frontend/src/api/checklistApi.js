import API from "./api";

// Security Hardening Checklist API (Module 6.1)
export const checklistApi = {
  // GET /api/v1/checklist  -> predefined checklists
  getChecklists: () => API.get("/checklist"),

  // GET /api/v1/checklist/projects/{projectId}/checklists
  getProjectChecklists: (projectId) =>
    API.get(`/checklist/projects/${projectId}/checklists`),

  // PUT /api/v1/checklist/checklists/{id}/status?project_id=
  updateStatus: (checklistId, projectId, status) =>
    API.put(`/checklist/checklists/${checklistId}/status`, { status }, {
      params: { project_id: projectId },
    }),

  // POST /api/v1/checklist/projects/{projectId}/generate-checklist
  generateChecklist: (projectId, payload = {}) =>
    API.post(`/checklist/projects/${projectId}/generate-checklist`, payload),

  // GET /api/v1/checklist/projects/{projectId}/checklist-score
  getScore: (projectId) =>
    API.get(`/checklist/projects/${projectId}/checklist-score`),

  // Module SC4: Security Posture
  getSecurityPosture: (projectId) =>
    API.get(`/checklist/projects/${projectId}/security-posture`),

  getPostureHistory: (projectId, limit = 30) =>
    API.get(`/checklist/projects/${projectId}/posture-history`, {
      params: { limit },
    }),

  // Module SC5: AI Recommendations & Score Tracking
  generateFromFindings: (projectId, scanId) =>
    API.post(`/sc5/${projectId}/generate-from-findings`, { scan_id: scanId }),

  getScoreHistory: (projectId, limit = 30) =>
    API.get(`/sc5/${projectId}/score-history`, { params: { limit } }),

  getImprovement: (projectId) =>
    API.get(`/sc5/${projectId}/improvement`),

  trackCompletion: (projectId) =>
    API.post(`/sc5/${projectId}/track-completion`),
};

export default checklistApi;
