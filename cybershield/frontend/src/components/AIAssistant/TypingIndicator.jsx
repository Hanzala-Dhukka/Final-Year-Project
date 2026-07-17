/**
 * Animated "thinking" indicator shown while the assistant is generating a reply.
 */
export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        <span className="text-gray-400 text-sm mr-2">CyberShield AI is thinking</span>
        <span className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
        </span>
      </div>
    </div>
  );
}
