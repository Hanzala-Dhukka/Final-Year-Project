import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { useOnClickOutside } from "../hooks";
import "./Dropdown.css";

/**
 * CyberShield Dropdown (custom menu)
 * options: [{ value, label, icon?, group? }]  | groups via `group` key
 * searchable → filters options. Keyboard: ↑/↓ navigate, Enter select, Esc close.
 */
export default function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  searchable = false,
  size = "md",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  useOnClickOutside(ref, () => setOpen(false));

  const selected = options.find((o) => o.value === value);
  const filtered = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    if (open) setActive(0);
  }, [open, query]);

  const choose = (o) => {
    onChange?.(o.value);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  let lastGroup = null;

  return (
    <div className={`cs-dropdown cs-dropdown--${size} ${className}`} ref={ref}>
      <button
        type="button"
        className="cs-dropdown__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="cs-dropdown__value">
          {selected ? (
            <>
              {selected.icon && <span className="cs-dropdown__opt-icon">{selected.icon}</span>}
              {selected.label}
            </>
          ) : (
            <span className="cs-dropdown__placeholder">{placeholder}</span>
          )}
        </span>
        <ChevronDown size={16} className={`cs-dropdown__chevron ${open ? "is-open" : ""}`} />
      </button>

      {open && (
        <div className="cs-dropdown__menu" role="listbox">
          {searchable && (
            <div className="cs-dropdown__search">
              <Search size={14} />
              <input
                autoFocus
                className="cs-dropdown__search-input"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
              />
            </div>
          )}
          <div className="cs-dropdown__list">
            {filtered.length === 0 && <div className="cs-dropdown__empty">No options</div>}
            {filtered.map((o, i) => {
              const showGroup = o.group && o.group !== lastGroup ? o.group : null;
              lastGroup = o.group;
              return (
                <div key={o.value}>
                  {showGroup && <div className="cs-dropdown__group">{showGroup}</div>}
                  <div
                    className={`cs-dropdown__option ${i === active ? "is-active" : ""} ${
                      o.value === value ? "is-selected" : ""
                    }`}
                    role="option"
                    aria-selected={o.value === value}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(o)}
                  >
                    {o.icon && <span className="cs-dropdown__opt-icon">{o.icon}</span>}
                    <span className="cs-dropdown__opt-label">{o.label}</span>
                    {o.value === value && <Check size={14} className="cs-dropdown__check" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
