import { forwardRef } from "react";
import { Check } from "lucide-react";
import "../Select/controls.css";

/** CyberShield Checkbox. Forwards ref to the native input (RHF/Formik compatible). */
const Checkbox = forwardRef(function Checkbox(
  { label, disabled = false, className = "", id, ...rest },
  ref
) {
  const fieldId = id || rest.name;
  return (
    <label
      className={`cs-control ${disabled ? "cs-control--disabled" : ""} ${className}`}
      htmlFor={fieldId}
    >
      <input ref={ref} id={fieldId} type="checkbox" disabled={disabled} {...rest} />
      <span className="cs-control__box cs-control__box--check">
        <Check size={12} className="cs-control__check" strokeWidth={3} />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
});

export default Checkbox;
