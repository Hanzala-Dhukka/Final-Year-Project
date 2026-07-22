import { useState } from "react";

/**
 * Payload editor for Attack Mode (spec Step 15). Free-text input + submit.
 */
export default function PayloadEditor({ onSubmit, disabled }) {
  const [payload, setPayload] = useState("");

  const submit = () => {
    if (!payload.trim()) return;
    onSubmit && onSubmit(payload);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <label className="block text-sm font-semibold text-gray-700 mb-2">Payload</label>
      <textarea
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        rows={3}
        placeholder="Enter your exploit payload…"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={submit}
        disabled={disabled || !payload.trim()}
        className="mt-3 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
      >
        🚀 Submit Attack
      </button>
    </div>
  );
}
