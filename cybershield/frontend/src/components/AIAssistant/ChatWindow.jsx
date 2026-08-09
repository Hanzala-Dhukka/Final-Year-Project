import {
  Bot,
  ScanSearch,
  FileWarning,
  Swords,
  HelpCircle,
  BookOpen,
  Sparkles,
} from "lucide-react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

// Suggested questions (Spec Step 11) for the general context
const GENERAL_SUGGESTIONS = [
  "Explain SQL Injection",
  "Explain XSS",
  "How do I improve my score?",
  "What is OWASP A01?",
  "How do I fix exposed secrets?",
];

// Context-aware suggested questions (Module 5.2, Step 12)
const CONTEXT_CONTENT = {
  github_scan: {
    title: "GitHub Scanner",
    icon: ScanSearch,
    suggestions: [
      "Explain this report.",
      "What is the highest risk?",
      "How to fix SQL Injection?",
      "Explain Hardcoded Secret.",
      "Show recommendations.",
    ],
  },
  threat_report: {
    title: "Threat Reports",
    icon: FileWarning,
    suggestions: [
      "Explain STRIDE.",
      "Why is it Critical?",
      "How to reduce the score?",
      "Explain MITRE.",
      "Why is Information Disclosure High?",
    ],
  },
  owasp: {
    title: "OWASP Simulator",
    icon: Swords,
    suggestions: [
      "Why did my SQL Injection attack fail?",
      "Explain the XSS simulation.",
      "How could I improve my defense?",
      "Teach me Broken Access Control.",
    ],
  },
  quiz: {
    title: "Quiz",
    icon: HelpCircle,
    suggestions: [
      "Why was my last answer wrong?",
      "Teach me today's quiz topic.",
      "Explain a missed question.",
      "Quiz study tips?",
    ],
  },
  glossary: {
    title: "Glossary",
    icon: BookOpen,
    suggestions: [
      "Define CSRF.",
      "What is a Zero-Day?",
      "Explain CORS.",
      "Define RCE.",
    ],
  },
  general: {
    title: "General",
    icon: Sparkles,
    suggestions: GENERAL_SUGGESTIONS,
  },
};

/**
 * Main chat panel: shows messages, a typing indicator, or an empty-state
 * welcome screen with context-aware suggested topics.
 */
export default function ChatWindow({ messages, loading, onSuggestion, context = "general" }) {
  const isEmpty = !messages || messages.length === 0;
  const content = CONTEXT_CONTENT[context] || CONTEXT_CONTENT.general;
  const Icon = content.icon;

  return (
    <div className="cs-ai-messages">
      {isEmpty && !loading ? (
        <div className="cs-ai-welcome">
          <div className="cs-ai-welcome__orb">
            <Bot size={38} />
          </div>
          <h2>
            Welcome to{" "}
            <span className="cs-ai-welcome__grad">CyberShield AI</span>
          </h2>
          <p>
            Your AI-powered security assistant. Ask about vulnerabilities,
            secure coding, threat models, and more — I'm tuned to your
            CyberShield data.
          </p>

          <span className="cs-ai-domain-chip">
            <Icon size={14} />
            {content.title} mode
          </span>

          <div className="cs-ai-suggestions">
            {content.suggestions.map((s) => (
              <button
                key={s}
                className="cs-ai-suggestion"
                onClick={() => onSuggestion(s)}
              >
                <Icon size={15} className="cs-ai-suggestion__icon" />
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="cs-ai-messages__inner">
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
          {loading && (
            <div className="cs-ai-row">
              <span className="cs-ai-avatar cs-ai-avatar--ai">
                <Bot size={18} />
              </span>
              <div className="cs-ai-bubble-wrap">
                <div className="cs-ai-typing cs-ai-bubble--ai">
                  <TypingIndicator />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}