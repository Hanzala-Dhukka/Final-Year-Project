import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { askAssistant } from "../../api/aiDashboardApi";
import "./AIAssistantButton.css";

const QUICK_QUESTIONS = [
  "Why is my score low?",
  "How can I fix SQL Injection?",
  "What is OWASP Top 10?",
  "How do I enable MFA?",
];

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`aab-msg ${isUser ? "aab-msg--user" : "aab-msg--ai"}`}>
      {!isUser && <span className="aab-msg-icon" aria-hidden="true">🤖</span>}
      <div className="aab-msg-bubble">
        {isUser
          ? <p>{msg.content}</p>
          : <ReactMarkdown>{msg.content}</ReactMarkdown>
        }
      </div>
    </div>
  );
}

export default function AIAssistantButton({ dashboardContext }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await askAssistant(q, dashboardContext);
      setMessages((prev) => [...prev, { role: "ai", content: res.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Sorry, I couldn't process that. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        className={`aab-fab ${open ? "aab-fab--open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={open}
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="aab-panel" role="dialog" aria-label="CyberShield AI Assistant" aria-modal="true">
          <div className="aab-panel-header">
            <span className="aab-panel-icon" aria-hidden="true">🤖</span>
            <div>
              <p className="aab-panel-title">CyberShield AI</p>
              <p className="aab-panel-sub">Ask me anything about your security</p>
            </div>
            <button className="aab-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>

          <div className="aab-messages" aria-live="polite">
            {messages.length === 0 && (
              <div className="aab-welcome">
                <p className="aab-welcome-msg">👋 Hi! I'm your AI security assistant. How can I help?</p>
                <div className="aab-quick-btns">
                  {QUICK_QUESTIONS.map((q) => (
                    <button key={q} className="aab-quick-btn" onClick={() => send(q)}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => <Message key={i} msg={m} />)}
            {loading && (
              <div className="aab-msg aab-msg--ai">
                <span className="aab-msg-icon" aria-hidden="true">🤖</span>
                <div className="aab-msg-bubble aab-typing" aria-label="AI is typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="aab-input-row">
            <textarea
              ref={inputRef}
              className="aab-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask CyberShield AI…"
              rows={1}
              aria-label="Message input"
              disabled={loading}
            />
            <button
              className="aab-send-btn"
              onClick={() => send()}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
