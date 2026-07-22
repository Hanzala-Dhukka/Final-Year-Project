import { forwardRef } from "react";
import "../Select/controls.css";

/** CyberShield Switch (toggle). Forwards ref to the native checkbox input. */
const Switch = forwardRef(function Switch(
  { label, disabled = false, className = "", id, ...rest },
  ref
) {
  const fieldId = id || rest.name;
  return (
    <label
      className={`cs-control ${disabled ? "cs-control--disabled" : ""} ${className}`}
      htmlFor={fieldId}
    >
      <input ref={ref} id={fieldId} type="checkbox" role="switch" disabled={disabled} {...rest} />
      <span className="cs-switch">
        <span className="cs-switch__thumb" />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
});

export default Switch;
