import API from "./api";

/**
 * AI Learning Recommendations API — Module E2
 *
 * Endpoints (mounted under /learning):
 *   POST /learning/recommendations  Generate recommendations from vulnerabilities
 *   GET  /learning/recommendations  Get latest recommendations
 *   GET  /learning/progress         Get user learning progress
 *   POST /learning/progress         Mark a topic as completed
 */

export const getRecommendations = async (vulnerabilities, scanId = null) => {
  const response = await API.post("/learning/recommendations", {
    vulnerabilities,
    scan_id: scanId,
  });
  return response.data;
};

export const getLatestRecommendations = async () => {
  const response = await API.get("/learning/recommendations");
  return response.data;
};

export const getLearningProgress = async () => {
  const response = await API.get("/learning/progress");
  return response.data;
};

export const markTopicCompleted = async (topic) => {
  const response = await API.post("/learning/progress", { topic });
  return response.data;
};

export default {
  getRecommendations,
  getLatestRecommendations,
  getLearningProgress,
  markTopicCompleted,
};
