import { forwardRef } from "react";
import "./field.css";

/** CyberShield Textarea — label, helper/error, required, disabled. */
const Textarea = forwardRef(function Textarea(
  { label, helperText, error, required = false, rows = 4, id, className = "", disabled, ...rest },
  ref
) {
  const fieldId = id || rest.name;
  return (
    <div className={`cs-field ${error ? "cs-field--error" : ""} ${className}`}>
      {label && (
        <label className="cs-field__label" htmlFor={fieldId}>
          {label}
          {required && <span className="cs-field__required">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        disabled={disabled}
        className="cs-field__input"
        style={{
          padding: "12px 14px",
          minHeight: 44,
          resize: "vertical",
          borderRadius: "var(--radius-md, 8px)",
          border: "1px solid var(--border-color, rgba(148,163,184,0.12))",
          background: "var(--card-bg, #111827)",
        }}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error ? (
        <span className="cs-field__error">{error}</span>
      ) : helperText ? (
        <span className="cs-field__help">{helperText}</span>
      ) : null}
    </div>
  );
});

export default Textarea;
