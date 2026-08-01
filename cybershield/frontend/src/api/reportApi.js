import API from "./api";

// Generate report from scan
export const generateReport = async (scanId) => {
  const response = await API.post(`/reports/generate/${scanId}`);
  return response.data;
};

// Get report by ID
export const getReport = async (reportId) => {
  const response = await API.get(`/reports/${reportId}`);
  return response.data;
};

// Get report by scan ID
export const getReportByScanId = async (scanId) => {
  const response = await API.get(`/reports/scan/${scanId}`);
  return response.data;
};

// Get report history
export const getReportHistory = async (limit = 50) => {
  const response = await API.get(`/reports/history`, {
    params: { limit },
  });
  return response.data;
};

// Download PDF
export const downloadPdf = async (reportId) => {
  const response = await API.get(`/reports/download/pdf/${reportId}`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `CyberShield_Report_${reportId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return response.data;
};

// Download JSON
export const downloadJson = async (reportId) => {
  const response = await API.get(`/reports/download/json/${reportId}`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `CyberShield_Report_${reportId}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return response.data;
};

// Download CSV
export const downloadCsv = async (reportId) => {
  const response = await API.get(`/reports/download/csv/${reportId}`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `CyberShield_Report_${reportId}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return response.data;
};

// Email report
export const emailReport = async (reportId, email) => {
  const response = await API.post(`/reports/email/${reportId}`, { email });
  return response.data;
};

// Get score history
export const getScoreHistory = async (repository, limit = 30) => {
  const response = await API.get(`/reports/score-history/${encodeURIComponent(repository)}`, {
    params: { limit },
  });
  return response.data;
};

// Compare scans
export const compareScans = async (oldScanId, newScanId) => {
  const response = await API.post(`/reports/compare`, {
    old_scan_id: oldScanId,
    new_scan_id: newScanId,
  });
  return response.data;
};

// Get AI executive summary
export const getAiSummary = async (scanId) => {
  const response = await API.get(`/reports/ai-summary/${scanId}`);
  return response.data;
};

// Delete report
export const deleteReport = async (reportId) => {
  const response = await API.delete(`/reports/${reportId}`);
  return response.data;
};

// Get chart data
export const getChartData = async (reportId) => {
  const response = await API.get(`/reports/chart-data/${reportId}`);
  return response.data;
};
