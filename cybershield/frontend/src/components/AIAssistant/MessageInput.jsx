import { useState } from "react";
import { Send } from "lucide-react";

/**
 * Chat input box with a disabled Send button while waiting for a response.
 * Supports multi-line input (Enter to send, Shift+Enter for a new line).
 */
export default function MessageInput({ onSend, disabled }) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const autoGrow = (e) => {
    setValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  return (
    <div className="cs-ai-inputbar">
      <div className="cs-ai-inputbar__inner">
        <div className="cs-ai-input-box">
          <textarea
            rows={1}
            value={value}
            onChange={autoGrow}
            onKeyDown={handleKeyDown}
            placeholder="Ask about OWASP, secure coding, authentication…"
            disabled={disabled}
          />
          <button
            onClick={submit}
            disabled={disabled || !value.trim()}
            className="cs-ai-send"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="cs-ai-hint">
          Press <kbd style={{ opacity: 0.8 }}>Enter</kbd> to send ·{" "}
          <kbd style={{ opacity: 0.8 }}>Shift+Enter</kbd> for a new line
        </div>
      </div>
    </div>
  );
}