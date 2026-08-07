import API from "./api";

/**
 * Threat Model API — ThreatAnalysis page
 */

export const createThreatModel = async (projectData) => {
  const response = await API.post("/threat-model/create", projectData);
  return response.data;
};

export const getThreatReports = async () => {
  const response = await API.get("/threat-dashboard/reports");
  return response.data;
};

export const getThreatDashboard = async (reportId) => {
  const response = await API.get(`/threat-dashboard/${reportId}`);
  return response.data;
};

export const getThreatHistory = async (projectId) => {
  const response = await API.get(`/threat-dashboard/history`, {
    params: { project_id: projectId },
  });
  return response.data;
};

export default {
  createThreatModel,
  getThreatReports,
  getThreatDashboard,
  getThreatHistory,
};
