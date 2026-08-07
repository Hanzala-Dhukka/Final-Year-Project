import API from "./api";

// Backend registers project_routes / workspace_routes / collaboration_routes
// all under the prefix "/api/v1/projects".
// The axios baseURL is "http://localhost:8000/api/v1", so all project-scoped
// calls must include the "/projects" segment.
export const projectApi = {
  // Projects
  list: () => API.get("/projects"),
  create: (payload) => API.post("/projects", payload),
  get: (id) => API.get(`/projects/${id}`),
  update: (id, payload) => API.put(`/projects/${id}`, payload),
  remove: (id) => API.delete(`/projects/${id}`),

  // Members
  invite: (id, payload) => API.post(`/projects/${id}/members`, payload),
  listMembers: (id) => API.get(`/projects/${id}/members`),
  removeMember: (id, userId) => API.delete(`/projects/${id}/members/${userId}`),

  // Reports / versions
  listReports: (id) => API.get(`/projects/${id}/reports`),
  createReport: (id, payload) => API.post(`/projects/${id}/reports`, payload),
  getVersion: (id, version) => API.get(`/projects/${id}/reports/${version}`),
  compareVersions: (id, a, b) =>
    API.post(`/projects/${id}/compare?version_a=${a}&version_b=${b}`),

  // Comments
  listComments: (reportId) => API.get(`/projects/reports/${reportId}/comments`),
  addComment: (reportId, content) =>
    API.post(`/projects/reports/${reportId}/comments`, { content }),
  deleteComment: (commentId) => API.delete(`/projects/comments/${commentId}`),

  // Activity & audit
  timeline: (id) => API.get(`/projects/${id}/timeline`),
  audit: (id) => API.get(`/projects/${id}/audit`),

  // Sharing
  share: (projectId, reportId, payload) =>
    API.post(`/projects/${projectId}/reports/${reportId}/share`, payload),
  revokeShare: (token) => API.delete(`/projects/share/${token}`),
};
