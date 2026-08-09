import { ShieldCheck, Send } from "lucide-react";

/**
 * Code editor for Defense Mode (spec Step 16). Plain textarea with monospace
 * styling. onValidate triggers AI review.
 */
export default function CodeEditor({ value, onChange, onSubmit, disabled }) {
  return (
    <div className="cs-ow-editor">
      <div className="cs-ow-editor-head">
        <h4>Rewrite the vulnerable code</h4>
        <span className="cs-ow-chip cs-ow-chip--success">
          <ShieldCheck size={11} /> Secure fix
        </span>
      </div>
      <textarea
        className="cs-ow-textarea"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        rows={10}
        spellCheck={false}
        placeholder={"// Rewrite the vulnerable code to be secure…\nfunction safeLookup(userId) {\n  return db.query(\"SELECT * FROM users WHERE id = ?\", [userId]);\n}"}
        disabled={disabled}
      />
      <div className="cs-ow-editor-actions">
        <button
          className="cs-ow-btn cs-ow-btn--defense cs-ow-btn--block"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
        >
          <Send size={16} /> Validate & Review
        </button>
      </div>
    </div>
  );
}