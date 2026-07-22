import { forwardRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import "./field.css";

/**
 * CyberShield SearchInput
 * Search icon, clear button, optional loading state, Ctrl/Cmd+K hint.
 * Optionally auto-focus when `ctrlK` is set and the user presses the shortcut.
 */
const SearchInput = forwardRef(function SearchInput(
  {
    value,
    onChange,
    loading = false,
    ctrlK = false,
    placeholder = "Search...",
    className = "",
    ...rest
  },
  ref
) {
  useEffect(() => {
    if (!ctrlK) return;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref?.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ctrlK, ref]);

  return (
    <div className={`cs-field ${className}`} style={{ width: "100%" }}>
      <div className="cs-field__control">
        <span className="cs-field__prefix">
          {loading ? <Loader2 size={16} className="cs-spin" /> : <Search size={16} />}
        </span>
        <input
          ref={ref}
          className="cs-field__input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type="search"
          {...rest}
        />
        {ctrlK && !value && (
          <span className="cs-search__kbd">
            <kbd>Ctrl</kbd>+<kbd>K</kbd>
          </span>
        )}
        {value && (
          <button
            type="button"
            className="cs-field__suffix cs-field__suffix--button"
            onClick={() => onChange?.({ target: { value: "" } })}
            aria-label="Clear search"
            tabIndex={-1}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
});

export default SearchInput;
