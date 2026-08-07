import API from "./api";

/**
 * AI Scan Summary API — Module E3
 *
 * Endpoints:
 *   POST /ai/scan-summary           Generate AI executive summary
 *   GET  /ai/scan-summary/{scan_id}  Retrieve stored summary
 */

export const generateScanSummary = async (scanData) => {
  const response = await API.post("/ai/scan-summary", scanData);
  return response.data;
};

export const getScanSummary = async (scanId) => {
  const response = await API.get(`/ai/scan-summary/${scanId}`);
  return response.data;
};

export default { generateScanSummary, getScanSummary };
