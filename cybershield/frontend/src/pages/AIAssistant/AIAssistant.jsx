import { useState, useEffect, useCallback, useRef } from "react";
import { Bot, Moon, Sun, AlertCircle, Trash2 } from "lucide-react";
import chatApi from "../../api/chatApi";
import { projectApi } from "../../api/projectApi";
import ChatSidebar from "../../components/AIAssistant/ChatSidebar";
import ChatWindow from "../../components/AIAssistant/ChatWindow";
import MessageInput from "../../components/AIAssistant/MessageInput";
import ContextSelector from "../../components/AIAssistant/ContextSelector";
import { useTheme } from "../../theme/useTheme";
import "./AIAssistant.css";

/**
 * Generate an initial question based on the context type and scan data
 */
function generateInitialQuestion(type, scanData) {
  switch (type) {
    case "github_scan":
      if (scanData.severity_summary?.critical > 0) {
        return `I have ${scanData.severity_summary.critical} critical vulnerabilities in my ${scanData.repository || "repository"}. What should I fix first?`;
      }
      if (scanData.severity_summary?.high > 0) {
        return `My scan shows ${scanData.severity_summary.high} high-severity issues. How do I prioritize remediation?`;
      }
      return `Explain the security findings for my ${scanData.repository || "repository"} scan.`;
    case "owasp":
      return `Explain the ${scanData.vulnerability || "vulnerability"} vulnerability and how to defend against it.`;
    default:
      return "Help me understand my security scan results.";
  }
}

/**
 * AI Security Assistant (Modules 5.1 & 5.2)
 *
 * Professional chat UI connected to the /chat backend. Fully theme-aware:
 * adapts to both dark and light mode, with an in-page toggle.
 *
 * Layout: sidebar (conversations) + chat window + input, with a project
 * selector and context dropdown so the assistant is aware of the user's
 * CyberShield data (GitHub scans, threat reports, OWASP, quizzes).
 */
export default function AIAssistant() {
  const { isDark, toggleTheme } = useTheme();

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

  const [mobileSidebar, setMobileSidebar] = useState(false);

  const scrollRef = useRef(null);
  const initDoneRef = useRef(false);

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

    // Check for context passed from other pages (Scan Results, OWASP, etc.)
    // Only run once on mount
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    const storedContext = sessionStorage.getItem("aiAssistantContext");
    if (storedContext) {
      try {
        const ctx = JSON.parse(storedContext);
        // Set the project/context domain based on the source
        if (ctx.type === "github_scan") {
          setContext("github_scan");
          changeContext("github_scan");
        } else if (ctx.type === "owasp") {
          setContext("owasp");
          changeContext("owasp");
        }
        // Optionally auto-send a question based on the context
        if (ctx.scanData) {
          const initialQuestion = generateInitialQuestion(ctx.type, ctx.scanData);
          // Small delay to allow context to be set on backend
          setTimeout(() => {
            handleSend(initialQuestion);
          }, 500);
        }
        // Clear the stored context so it doesn't trigger again on refresh
        sessionStorage.removeItem("aiAssistantContext");
      } catch (e) {
        console.error("Failed to parse AI Assistant context", e);
        sessionStorage.removeItem("aiAssistantContext");
      }
    }
  }, [loadConversations, loadProjects, loadContext]); // Only run once on mount

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
    setMobileSidebar(false);
  };

  const handleNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setError("");
    setMobileSidebar(false);
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

  // Step 15 — Clear Chat button
  const handleClearChat = async (id) => {
    if (window.confirm("Delete this conversation?")) {
      await handleDelete(id);
    }
  };

  // Update the active context on the backend whenever project/context changes
  const changeContext = useCallback(
    async (nextContext) => {
      setContext(nextContext);
      try {
        const res = await chatApi.updateContext(projectId, nextContext);
        setContextMeta(res.data || {});
      } catch (e) {
        console.error("Failed to update context", e);
      }
    },
    [projectId]
  );

  const changeProject = useCallback(
    async (nextProjectId) => {
      setProjectId(nextProjectId);
      try {
        const res = await chatApi.updateContext(nextProjectId, context);
        setContextMeta(res.data || {});
      } catch (e) {
        console.error("Failed to update project context", e);
      }
    },
    [context]
  );

  const handleSend = useCallback(
    async (text) => {
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
    },
    [activeId, context, projectId]
  );

  const activeProject = projects.find((p) => p._id === projectId || p.id === projectId);
  const activeConversation = conversations.find((c) => c.id === activeId);

  return (
    <div className="cs-ai-assistant">
      {/* Header */}
      <header className="cs-ai-header">
        <div className="cs-ai-brand">
          <div className="cs-ai-logo">
            <Bot size={22} />
          </div>
          <div>
            <h1>CyberShield AI</h1>
            <p className="subtitle">Security Copilot &amp; Learning Assistant</p>
          </div>
        </div>

        <div className="cs-ai-header-spacer" />

        <div className="cs-ai-controls">
          {/* Active project selector */}
          <span className="cs-ai-field">
            <span className="cs-ai-select__label">Project:</span>
            <select
              value={projectId || ""}
              onChange={(e) => changeProject(e.target.value || null)}
              className="cs-ai-select"
            >
              <option value="">General (no project)</option>
              {projects.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </span>

          {/* Context domain selector */}
          <ContextSelector value={context} onChange={changeContext} />

          {/* In-page theme toggle (light mode) */}
          <button
            className="cs-ai-icon-btn"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="cs-ai-body">
        {/* Sidebar — mobile overlay */}
        <div
          className={`cs-ai-sidebar ${mobileSidebar ? "cs-ai-sidebar--open" : ""}`}
        >
          <ChatSidebar
            conversations={conversations}
            activeId={activeId}
            onSelect={handleSelect}
            onNewChat={handleNewChat}
            onDelete={handleDelete}
            onClearChat={handleClearChat}
          />
          {/* Mobile close */}
          {mobileSidebar && (
            <button
              className="cs-ai-clearchat"
              style={{ margin: 8, width: "auto" }}
              onClick={() => setMobileSidebar(false)}
            >
              ← Close
            </button>
          )}
        </div>

        <div className="cs-ai-main">
          {/* Context summary strip */}
          <div
            className="cs-ai-status"
            style={{ margin: "12px 20px 0", alignSelf: "flex-start" }}
          >
            <span className="cs-ai-status__dot" />
            {activeProject
              ? `Context: ${activeProject.name} · ${contextLabel(context)}`
              : `Context: ${contextLabel(context)}`}
          </div>

          {error && (
            <div className="cs-ai-error">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                }}
                aria-label="Dismiss error"
              >
                <span style={{ opacity: 0.6 }}>✕</span>
              </button>
            </div>
          )}

          <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <ChatWindow
              messages={messages}
              loading={loading}
              onSuggestion={handleSend}
              context={context}
            />
          </div>

          <MessageInput onSend={handleSend} disabled={loading} />
        </div>
      </div>
    </div>
  );
}

/** Human-readable label for the internal context keys. */
function contextLabel(context) {
  const labels = {
    general: "General",
    github_scan: "GitHub Scanner",
    threat_report: "Threat Reports",
    owasp: "OWASP Simulator",
    quiz: "Quiz",
    glossary: "Glossary",
  };
  return labels[context] || "General";
}