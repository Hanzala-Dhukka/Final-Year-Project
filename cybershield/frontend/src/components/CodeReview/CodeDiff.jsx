/**
 * Displays the AI-generated secure code in a syntax-highlighted block.
 * Accepts a language hint to pick the highlighter grammar.
 */
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function CodeDiff({ code, language = "text" }) {
  if (!code) return null;
  const lang = (language || "text").toLowerCase();
  return (
    <div className="bg-white border border-green-200 rounded-lg p-4">
      <h3 className="text-lg font-bold text-green-700 mb-2">Secure Code</h3>
      <SyntaxHighlighter language={lang} style={oneDark} PreTag="div">
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
