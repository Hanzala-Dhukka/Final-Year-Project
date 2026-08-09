/**
 * Animated "thinking" dots shown while the assistant is generating a reply.
 */
export default function TypingIndicator() {
  return (
    <div className="cs-ai-typing" style={{ padding: 0 }}>
      <span className="cs-ai-typing__dots">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}