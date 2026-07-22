/**
 * aiDashboardApi.js
 * All AI-dashboard API calls. The backend never exposes the Groq key to the
 * browser — React → FastAPI → Groq is the only allowed flow.
 */
import axios from "axios";

const BASE = "http://localhost:8000/api/v1/ai-dashboard";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const cfg = () => ({ headers: authHeader() });

/**
 * POST a security data snapshot; get back the full AI analysis object.
 * @param {Object} data  Dashboard snapshot (critical, high, medium, low, score, …)
 */
export const getSecurityAnalysis  = (data) =>
  axios.post(`${BASE}/security-analysis`, data, cfg()).then((r) => r.data);

/** AI-calculated risk score with breakdown + trend. */
export const getRiskScore         = (data) =>
  axios.post(`${BASE}/risk-score`, data, cfg()).then((r) => r.data);

/** Tiered (immediate / short-term / long-term) AI recommendations. */
export const getRecommendations   = (data) =>
  axios.post(`${BASE}/recommendations`, data, cfg()).then((r) => r.data);

/** Trend analysis across vulnerability history. */
export const getTrendAnalysis     = (data) =>
  axios.post(`${BASE}/trend-analysis`, data, cfg()).then((r) => r.data);

/** Personalised learning path. */
export const getLearningRecommendation = (data) =>
  axios.post(`${BASE}/learning-recommendation`, data, cfg()).then((r) => r.data);

/** Executive security report. */
export const getExecutiveReport   = (data) =>
  axios.post(`${BASE}/executive-report`, data, cfg()).then((r) => r.data);

/**
 * Free-form AI assistant Q&A.
 * @param {string} question   User's question
 * @param {Object} [context]  Optional dashboard snapshot for context
 */
export const askAssistant         = (question, context = null) =>
  axios.post(`${BASE}/assistant`, { question, context }, cfg()).then((r) => r.data);

/** Clear the 24-hour AI cache for the current user. */
export const clearAICache         = () =>
  axios.delete(`${BASE}/cache`, cfg()).then((r) => r.data);
