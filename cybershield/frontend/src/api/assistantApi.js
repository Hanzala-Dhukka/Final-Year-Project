import API from "./api";

/**
 * AI Security Assistant API — Module E1
 *
 * Endpoints (mounted under /assistant):
 *   POST /assistant/chat      Ask a security question
 *   GET  /assistant/history   Retrieve chat history
 */

export const askAssistant = async (data) => {
  const response = await API.post("/assistant/chat", data);
  return response.data;
};

export const getAssistantHistory = async () => {
  const response = await API.get("/assistant/history");
  return response.data;
};

export default { askAssistant, getAssistantHistory };
