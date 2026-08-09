import { Bot, User } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

/**
 * A single chat message. User messages are right-aligned; AI messages
 * render markdown on the left with an avatar.
 */
export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`cs-ai-row ${isUser ? "cs-ai-row--user" : ""}`}>
      <span className={`cs-ai-avatar ${isUser ? "cs-ai-avatar--user" : "cs-ai-avatar--ai"}`}>
        {isUser ? <User size={17} /> : <Bot size={17} />}
      </span>

      <div className="cs-ai-bubble-wrap">
        <div className="cs-ai-role">{isUser ? "You" : "CyberShield AI"}</div>
        <div className={`cs-ai-bubble ${isUser ? "cs-ai-bubble--user" : "cs-ai-bubble--ai"}`}>
          {isUser ? (
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>
      </div>
    </div>
  );
}