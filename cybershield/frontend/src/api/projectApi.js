import API from "./api";

// Collaborative workspace (Module 4.5)
// NOTE: backend registers project_routes / workspace_routes / collaboration_routes
// all under the prefix "/api/v1/projects" with RELATIVE paths (e.g. "/{project_id}").
// So project-scoped calls must NOT prepend an extra "/projects" segment.
export const projectApi = {
  // Projects
  list: () => API.get("/projects"),
  create: (payload) => API.post("/projects", payload),
  get: (id) => API.get(`/${id}`),
  update: (id, payload) => API.put(`/${id}`, payload),
  remove: (id) => API.delete(`/${id}`),

  // Members
  invite: (id, payload) => API.post(`/${id}/members`, payload),
  listMembers: (id) => API.get(`/${id}/members`),
  removeMember: (id, userId) => API.delete(`/${id}/members/${userId}`),

  // Reports / versions
  listReports: (id) => API.get(`/${id}/reports`),
  createReport: (id, payload) => API.post(`/${id}/reports`, payload),
  getVersion: (id, version) => API.get(`/${id}/reports/${version}`),
  compareVersions: (id, a, b) =>
    API.post(`/${id}/compare?version_a=${a}&version_b=${b}`),

  // Comments
  listComments: (reportId) => API.get(`/reports/${reportId}/comments`),
  addComment: (reportId, content) =>
    API.post(`/reports/${reportId}/comments`, { content }),
  deleteComment: (commentId) => API.delete(`/comments/${commentId}`),

  // Activity & audit
  timeline: (id) => API.get(`/${id}/timeline`),
  audit: (id) => API.get(`/${id}/audit`),

  // Sharing
  share: (projectId, reportId, payload) =>
    API.post(`/${projectId}/reports/${reportId}/share`, payload),
  revokeShare: (token) => API.delete(`/share/${token}`),
};
