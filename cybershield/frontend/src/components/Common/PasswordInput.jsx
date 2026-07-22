import { useState, forwardRef } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

/**
 * PasswordInput — reusable password field with a visibility toggle.
 * Forwards ref + spreads props so it works with React Hook Form / Zod.
 * Styling lives in components/Common/common-auth.css.
 */
const PasswordInput = forwardRef(function PasswordInput(
  { value, onChange, placeholder = "Password", id, disabled = false, error, ...rest },
  ref
) {
  const [show, setShow] = useState(false);

  return (
    <div className={`cs-pwd-field ${error ? "cs-pwd-field--error" : ""}`}>
      <Lock size={18} className="cs-pwd-field-icon" aria-hidden="true" />
      <input
        ref={ref}
        id={id}
        type={show ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        className="cs-pwd-field-input"
        {...rest}
      />
      <button
        type="button"
        className="cs-pwd-field-toggle"
        onClick={() => setShow((s) => !s)}
        disabled={disabled}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
});

export default PasswordInput;
