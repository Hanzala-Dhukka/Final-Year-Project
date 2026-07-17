import API from "./api";

// AI Remediation Engine API (Module 5.4)
// All endpoints are mounted under /api/v1/remediation

export const remediationApi = {
  // Generate a remediation for a finding
  generate: (payload) => API.post("/remediation/generate", payload),

  // List recommendations for a project
  listByProject: (projectId) => API.get(`/remediation/${projectId}`),

  // Get a single full report
  getReport: (reportId) => API.get(`/remediation/report/${reportId}`),

  // Update status (Open | In Progress | Fixed)
  updateStatus: (reportId, status) =>
    API.put(`/remediation/${reportId}/status`, { status }),

  // Mark as fixed + record re-scan verification
  markFixed: (reportId) => API.post(`/remediation/${reportId}/fix`),
};

export default remediationApi;
