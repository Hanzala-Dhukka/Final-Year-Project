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
};

export default checklistApi;
