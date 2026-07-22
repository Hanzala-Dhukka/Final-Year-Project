import { useState, useRef } from "react";
import { useOnClickOutside } from "../hooks";
import "./Tooltip.css";

/**
 * CyberShield Tooltip — hover/focus triggered, positioned by `placement`.
 */
export default function Tooltip({ content, children, placement = "top", className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOnClickOutside(ref, () => setOpen(false));

  return (
    <span
      ref={ref}
      className={`cs-tooltip-wrap ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span className={`cs-tooltip cs-tooltip--${placement}`} role="tooltip">
          {content}
        </span>
      )}
    </span>
  );
}
