import API from "./api";

// Get findings for a scan
export const getFindings = async (scanId, filters = {}) => {
  const params = {};
  if (filters.severity) params.severity = filters.severity;
  if (filters.rule_id) params.rule_id = filters.rule_id;
  if (filters.file) params.file = filters.file;
  if (filters.status) params.status = filters.status;
  if (filters.limit) params.limit = filters.limit;
  if (filters.offset) params.offset = filters.offset;
  const response = await API.get(`/scanner/${scanId}/findings`, { params });
  return response.data;
};

// Get findings grouped by file
export const getFindingsByFile = async (scanId) => {
  const response = await API.get(`/scanner/${scanId}/findings/by-file`);
  return response.data;
};

// Get findings summary
export const getFindingsSummary = async (scanId) => {
  const response = await API.get(`/scanner/${scanId}/findings/summary`);
  return response.data;
};

// Update finding status
export const updateFindingStatus = async (findingId, status) => {
  const response = await API.patch(`/scanner/${findingId}/status`, { status });
  return response.data;
};

// Delete findings for a scan
export const deleteFindings = async (scanId) => {
  const response = await API.delete(`/scanner/${scanId}/findings`);
  return response.data;
};
