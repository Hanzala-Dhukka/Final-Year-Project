import API from "./api";
import { downloadBlob } from "./complianceApi";

// Executive Security Dashboard (Module 6.4)
export const analyticsApi = {
  // Full dashboard payload (KPIs + trends + comparison + AI summary).
  getSummary: (sortBy = "security_score") =>
    API.get("/analytics/summary", { params: { sort_by: sortBy } }),

  // Security / risk / compliance trend points.
  getTrends: () => API.get("/analytics/trends"),

  // Vulnerability severity trend points.
  getVulnerabilities: () => API.get("/analytics/vulnerabilities"),

  // Project comparison table.
  getCompare: (sortBy = "security_score") =>
    API.get("/analytics/compare", { params: { sort_by: sortBy } }),

  // Executive report exports.
  exportPdf: () => API.get("/analytics/report", { responseType: "blob" }),
  exportJson: () => API.get("/analytics/report/json", { responseType: "blob" }),
};

export { downloadBlob };
export default analyticsApi;
