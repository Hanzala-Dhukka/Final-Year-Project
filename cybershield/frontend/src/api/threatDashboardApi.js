import API from "./api";

// Interactive Threat Modeling Dashboard (Module 4.4)
export const getDashboard = (reportId) =>
  API.get(`/threat-dashboard/${reportId}`);

export const getDashboardReports = () => API.get("/threat-dashboard/reports");

export const getRiskHistory = () => API.get("/threat-dashboard/history");

export const compareReports = (reportA, reportB) =>
  API.post("/threat-dashboard/compare", { report_a: reportA, report_b: reportB });
