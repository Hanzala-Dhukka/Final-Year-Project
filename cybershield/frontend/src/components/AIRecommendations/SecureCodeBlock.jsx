import { useState } from "react";

/**
 * Read-only code block for the secure replacement snippet, with a copy button.
 */
export default function SecureCodeBlock({ code = "", language = "" }) {
  const [copied, setCopied] = useState(false);

  if (!code || !code.trim()) {
    return <p className="text-sm text-gray-400">No secure code provided.</p>;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="relative">
      <button
        onClick={copy}
        className="absolute top-2 right-2 text-xs bg-gray-700 text-gray-100 px-2 py-1 rounded hover:bg-gray-600"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="bg-gray-900 text-gray-100 text-xs p-3 rounded overflow-x-auto">
        <code>{code}</code>
      </pre>
      {language && (
        <p className="text-xs text-gray-400 mt-1">Language: {language}</p>
      )}
    </div>
  );
}
