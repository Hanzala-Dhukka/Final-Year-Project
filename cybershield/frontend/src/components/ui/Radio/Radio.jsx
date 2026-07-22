import { forwardRef } from "react";
import "../Select/controls.css";

/** CyberShield Radio. Forwards ref to the native input. */
const Radio = forwardRef(function Radio(
  { label, disabled = false, className = "", id, ...rest },
  ref
) {
  const fieldId = id || rest.name;
  return (
    <label
      className={`cs-control ${disabled ? "cs-control--disabled" : ""} ${className}`}
      htmlFor={fieldId}
    >
      <input ref={ref} id={fieldId} type="radio" disabled={disabled} {...rest} />
      <span className="cs-control__box cs-control__box--radio">
        <span className="cs-control__dot" />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
});

export default Radio;
