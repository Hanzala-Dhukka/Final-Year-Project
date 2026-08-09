import { useState } from "react";
import { Rocket, Zap } from "lucide-react";

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
    <div className="cs-ow-editor">
      <div className="cs-ow-editor-head">
        <h4>Craft your payload</h4>
        <span className="cs-ow-chip cs-ow-chip--danger">
          <Zap size={11} /> Attack vector
        </span>
      </div>
      <textarea
        className="cs-ow-textarea"
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        rows={3}
        spellCheck={false}
        placeholder="Enter your exploit payload… e.g. ' OR 1=1 --"
        disabled={disabled}
      />
      <div className="cs-ow-editor-actions">
        <button
          className="cs-ow-btn cs-ow-btn--attack cs-ow-btn--block"
          onClick={submit}
          disabled={disabled || !payload.trim()}
        >
          <Rocket size={16} /> Submit Attack
        </button>
      </div>
    </div>
  );
}