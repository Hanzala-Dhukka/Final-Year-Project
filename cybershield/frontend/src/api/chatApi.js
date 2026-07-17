import API from "./api";

// AI Security Assistant API (Modules 5.1 & 5.2)
// All endpoints are mounted under /api/v1/chat

export const chatApi = {
  // Get the user's active project + context domain
  getContext: () => API.get("/chat/context"),

  // Update the user's active project + context domain
  updateContext: (project_id, context) =>
    API.post("/chat/context", { project_id, context }),

  // Create a new conversation
  createConversation: () => API.post("/chat/new"),

  // Send a message (auto-creates a conversation when conversation_id is omitted)
  sendMessage: (conversation_id, message, context = null, project_id = null) =>
    API.post("/chat/message", { conversation_id, message, context, project_id }),

  // List the user's conversations
  getConversations: () => API.get("/chat/conversations"),

  // Get messages for a conversation
  getMessages: (conversation_id) => API.get(`/chat/${conversation_id}`),

  // Delete a conversation
  deleteConversation: (conversation_id) => API.delete(`/chat/${conversation_id}`),
};

export default chatApi;
