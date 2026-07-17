import { useState, useEffect, useCallback, useRef } from "react";
import chatApi from "../../api/chatApi";
import { projectApi } from "../../api/projectApi";
import ChatSidebar from "../../components/AIAssistant/ChatSidebar";
import ChatWindow from "../../components/AIAssistant/ChatWindow";
import MessageInput from "../../components/AIAssistant/MessageInput";
import ContextSelector from "../../components/AIAssistant/ContextSelector";

/**
 * AI Security Assistant (Modules 5.1 & 5.2)
 *
 * Layout: sidebar (conversations) + chat window + input, with a project
 * selector and context dropdown so the assistant is aware of the user's
 * CyberShield data (GitHub scans, threat reports, OWASP, quizzes).
 */
export default function AIAssistant() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Context-aware state (Module 5.2)
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [context, setContext] = useState("general");
  const [contextMeta, setContextMeta] = useState({});

  const scrollRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await chatApi.getConversations();
      setConversations(res.data || []);
    } catch (e) {
      console.error("Failed to load conversations", e);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const res = await projectApi.list();
      setProjects(res.data || []);
    } catch (e) {
      console.error("Failed to load projects", e);
    }
  }, []);

  const loadContext = useCallback(async () => {
    try {
      const res = await chatApi.getContext();
      const c = res.data || {};
      setProjectId(c.project_id || null);
      setContext(c.context || "general");
      setContextMeta(c);
    } catch (e) {
      console.error("Failed to load context", e);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadProjects();
    loadContext();
  }, [loadConversations, loadProjects, loadContext]);

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const loadMessages = useCallback(async (conversationId) => {
    try {
      const res = await chatApi.getMessages(conversationId);
      const data = res.data || {};
      // Adopt the conversation's stored context/project on open
      if (data.project_id) setProjectId(data.project_id);
      if (data.context) setContext(data.context);
      const msgs = (data.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      setMessages(msgs);
    } catch (e) {
      console.error("Failed to load messages", e);
      setMessages([]);
    }
  }, []);

  const handleSelect = async (id) => {
    setActiveId(id);
    setError("");
    await loadMessages(id);
  };

  const handleNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setError("");
  };

  const handleDelete = async (id) => {
    try {
      await chatApi.deleteConversation(id);
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      await loadConversations();
    } catch (e) {
      console.error("Failed to delete conversation", e);
    }
  };

  // Update the active context on the backend whenever project/context changes
  const changeContext = async (nextContext) => {
    setContext(nextContext);
    try {
      const res = await chatApi.updateContext(projectId, nextContext);
      setContextMeta(res.data || {});
    } catch (e) {
      console.error("Failed to update context", e);
    }
  };

  const changeProject = async (nextProjectId) => {
    setProjectId(nextProjectId);
    try {
      const res = await chatApi.updateContext(nextProjectId, context);
      setContextMeta(res.data || {});
    } catch (e) {
      console.error("Failed to update project context", e);
    }
  };

  const handleSend = async (text) => {
    setLoading(true);
    setError("");
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await chatApi.sendMessage(activeId, text, context, projectId);
      const data = res.data;
      const conversationId = data.conversation_id;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);

      if (!activeId || activeId !== conversationId) {
        setActiveId(conversationId);
      }
      // Refresh sidebar (title may have been auto-generated)
      await loadConversations();
    } catch (e) {
      setError("Sorry, I couldn't process your message. Please try again.");
      setMessages((prev) => prev.slice(0, -1)); // remove the optimistic user msg
    } finally {
      setLoading(false);
    }
  };

  const activeProject = projects.find((p) => p._id === projectId || p.id === projectId);

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-lg shadow overflow-hidden">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelect}
        onNewChat={handleNewChat}
        onDelete={handleDelete}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-6 py-3 border-b border-gray-200 flex flex-wrap items-center gap-3">
          <span className="text-blue-600 font-bold text-lg">🛡️ CyberShield AI</span>

          {/* Project selector (context switching) */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Project:</span>
            <select
              value={projectId || ""}
              onChange={(e) => changeProject(e.target.value || null)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">General (no project)</option>
              {projects.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Context domain selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Context:</span>
            <ContextSelector value={context} onChange={changeContext} />
          </div>

          {activeId && (
            <span className="text-sm text-gray-400 truncate ml-auto">
              {conversations.find((c) => c.id === activeId)?.title}
            </span>
          )}
        </header>

        <div ref={scrollRef} className="flex-1 min-h-0">
          <ChatWindow
            messages={messages}
            loading={loading}
            onSuggestion={handleSend}
            context={context}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 px-6 py-2 bg-red-50">{error}</p>
        )}

        <MessageInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  );
}
