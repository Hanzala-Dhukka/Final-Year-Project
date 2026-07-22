import { forwardRef } from "react";
import "./field.css";

/**
 * CyberShield Input
 * Label, helper text, error message, prefix/suffix icons, required indicator.
 * Compatible with React Hook Form / Formik (forwards ref, spreads props).
 */
const Input = forwardRef(function Input(
  {
    label,
    helperText,
    error,
    required = false,
    size = "md",
    prefix,
    suffix,
    id,
    className = "",
    disabled = false,
    ...rest
  },
  ref
) {
  const fieldId = id || rest.name;
  const stateClass = error ? "cs-field--error" : rest.success ? "cs-field--success" : "";

  return (
    <div className={`cs-field ${stateClass} ${disabled ? "cs-field--disabled" : ""} ${className}`}>
      {label && (
        <label className="cs-field__label" htmlFor={fieldId}>
          {label}
          {required && <span className="cs-field__required">*</span>}
        </label>
      )}
      <div className="cs-field__control">
        {prefix && <span className="cs-field__prefix">{prefix}</span>}
        <input
          ref={ref}
          id={fieldId}
          className="cs-field__input"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        {suffix && <span className="cs-field__suffix">{suffix}</span>}
      </div>
      {error ? (
        <span className="cs-field__error">{error}</span>
      ) : helperText ? (
        <span className="cs-field__help">{helperText}</span>
      ) : null}
    </div>
  );
});

export default Input;
