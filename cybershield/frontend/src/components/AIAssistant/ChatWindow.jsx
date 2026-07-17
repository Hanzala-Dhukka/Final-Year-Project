import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

const GENERAL_SUGGESTIONS = [
  "OWASP",
  "Secure Coding",
  "Authentication",
  "Threat Modeling",
  "Vulnerability Analysis",
  "Python Security",
  "Web Security",
];

// Context-aware suggested questions (Module 5.2, Step 12)
const CONTEXT_SUGGESTIONS = {
  github_scan: [
    "Explain this report.",
    "What is the highest risk?",
    "How to fix SQL Injection?",
    "Explain Hardcoded Secret.",
    "Show recommendations.",
  ],
  threat_report: [
    "Explain STRIDE.",
    "Why is it Critical?",
    "How to reduce the score?",
    "Explain MITRE.",
    "Why is Information Disclosure High?",
  ],
  owasp: [
    "Why did my SQL Injection attack fail?",
    "Explain the XSS simulation.",
    "How could I improve my defense?",
    "Teach me Broken Access Control.",
  ],
  quiz: [
    "Why was my last answer wrong?",
    "Teach me today's quiz topic.",
    "Explain a missed question.",
    "Quiz study tips?",
  ],
  glossary: [
    "Define CSRF.",
    "What is a Zero-Day?",
    "Explain CORS.",
    "Define RCE.",
  ],
  general: GENERAL_SUGGESTIONS,
};

/**
 * Main chat panel: shows messages, a typing indicator, or an empty-state
 * welcome screen with context-aware suggested topics.
 */
export default function ChatWindow({ messages, loading, onSuggestion, context = "general" }) {
  const isEmpty = !messages || messages.length === 0;
  const suggestions = CONTEXT_SUGGESTIONS[context] || GENERAL_SUGGESTIONS;

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100">
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isEmpty && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome to CyberShield AI
            </h2>
            <p className="text-gray-500 mb-6">Ask me about:</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => onSuggestion(s)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-blue-400 hover:text-blue-600"
                >
                  • {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {loading && <TypingIndicator />}
          </div>
        )}
      </div>
    </div>
  );
}
