import { forwardRef } from "react";

/**
 * AuthInput — labelled text input for the auth screens.
 * Supports an optional prefix icon, error message, and password visibility
 * toggle (when type="password" and showToggle is set).
 */
const AuthInput = forwardRef(function AuthInput(
  {
    label,
    icon,
    error,
    type = "text",
    suffix,
    id,
    className = "",
    disabled = false,
    ...rest
  },
  ref
) {
  return (
    <div className={`auth-field ${error ? "auth-field--error" : ""} ${className}`}>
      {label && (
        <label htmlFor={id} className="auth-label">
          {label}
        </label>
      )}
      <div className="auth-input-wrap">
        {icon && <span className="auth-input-icon">{icon}</span>}
        <input
          ref={ref}
          id={id}
          type={type}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className="auth-input"
          {...rest}
        />
        {suffix}
      </div>
      {error && <span className="auth-input-error">{error}</span>}
    </div>
  );
});

export default AuthInput;
