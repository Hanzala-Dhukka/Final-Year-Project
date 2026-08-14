import API from "./api";

/**
 * Security Header Analyzer API — SecurityHeaderAnalyzer page
 * Backed by the backend "security analyzer" module (app/routes/security_routes.py).
 */

export const analyzeSecurityHeaders = async (url) => {
  const response = await API.post("/security/analyze-headers", { url });
  return response.data;
};

export const getHeaderScanHistory = async () => {
  const response = await API.get("/security/history");
  return response.data;
};

export default {
  analyzeSecurityHeaders,
  getHeaderScanHistory,
};