import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import "./controls.css";
import "./Select.css";

/**
 * CyberShield Select — styled native <select> (full keyboard + a11y support).
 * options: [{ value, label, disabled? }]
 */
const Select = forwardRef(function Select(
  { label, options = [], value, onChange, placeholder, disabled = false, error, size = "md", id, className = "", ...rest },
  ref
) {
  const fieldId = id || rest.name;
  return (
    <div className={`cs-field ${error ? "cs-field--error" : ""} ${className}`}>
      {label && (
        <label className="cs-field__label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <div className={`cs-select cs-select--${size} cs-field__control`}>
        <select
          ref={ref}
          id={fieldId}
          className="cs-field__input cs-select__input"
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="cs-select__chevron" />
      </div>
      {error && <span className="cs-field__error">{error}</span>}
    </div>
  );
});

export default Select;
