import { useState } from "react";

/**
 * Code editor for Defense Mode (spec Step 16). Plain textarea with monospace
 * styling (no heavyweight editor dependency). onValidate triggers AI review.
 */
export default function CodeEditor({ value, onChange, onSubmit, disabled }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <label className="block text-sm font-semibold text-gray-700 mb-2">Secure Code Editor</label>
      <textarea
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        rows={10}
        spellCheck={false}
        placeholder="Rewrite the vulnerable code to be secure…"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        ✅ Validate & Review
      </button>
    </div>
  );
}
