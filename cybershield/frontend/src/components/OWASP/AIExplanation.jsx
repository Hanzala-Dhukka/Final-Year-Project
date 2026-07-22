import MarkdownRenderer from "../AIAssistant/MarkdownRenderer";

/**
 * AI Coach explanation block (spec Step 18). Renders markdown from the coach,
 * plus optional OWASP reference / business impact / fix chips.
 */
export default function AIExplanation({ explanation, provider, owasp, businessImpact, fix }) {
  if (!explanation && !owasp) return null;
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">🤖 AI Coach</h3>
        {provider && <span className="text-xs text-gray-400">via {provider}</span>}
      </div>

      {owasp && (
        <span className="inline-block mb-2 text-xs px-2 py-0.5 rounded bg-red-50 text-red-600">
          {owasp}
        </span>
      )}

      {explanation && <MarkdownRenderer content={explanation} />}

      {businessImpact && (
        <div className="mt-3">
          <p className="text-sm font-semibold text-gray-700">Business Impact</p>
          <p className="text-sm text-gray-600">{businessImpact}</p>
        </div>
      )}
      {fix && (
        <div className="mt-2">
          <p className="text-sm font-semibold text-gray-700">How to Fix</p>
          <p className="text-sm text-gray-600">{fix}</p>
        </div>
      )}
    </div>
  );
}
