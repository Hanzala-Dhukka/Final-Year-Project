import MarkdownRenderer from "../AIAssistant/MarkdownRenderer";

/**
 * Renders the AI's vulnerability explanation (markdown).
 */
export default function AIExplanation({ text }) {
  if (!text) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-bold text-gray-900 mb-2">AI Explanation</h3>
      <MarkdownRenderer content={text} />
    </div>
  );
}
