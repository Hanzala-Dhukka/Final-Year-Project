import { useState } from "react";
import { ChevronDown } from "lucide-react";
import "./Accordion.css";

function Item({ item, isOpen, onToggle }) {
  return (
    <div className={`cs-accordion__item ${isOpen ? "is-open" : ""}`}>
      <button
        type="button"
        className="cs-accordion__trigger"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span className="cs-accordion__title">{item.title}</span>
        {item.badge != null && <span className="cs-accordion__badge">{item.badge}</span>}
        <ChevronDown size={18} className="cs-accordion__chevron" />
      </button>
      <div className="cs-accordion__panel" style={{ maxHeight: isOpen ? "1000px" : 0 }}>
        <div className="cs-accordion__content">{item.content}</div>
      </div>
    </div>
  );
}

/**
 * CyberShield Accordion
 * items: [{ title, content, badge? }]
 * allowMultiple → open several at once. Controlled via `openIndex`.
 */
export default function Accordion({ items = [], allowMultiple = false, defaultOpen = null }) {
  const [open, setOpen] = useState(() => {
    if (allowMultiple) return defaultOpen ? [defaultOpen] : [];
    return defaultOpen;
  });

  const toggle = (i) => {
    if (allowMultiple) {
      setOpen((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]));
    } else {
      setOpen((o) => (o === i ? null : i));
    }
  };

  return (
    <div className="cs-accordion">
      {items.map((item, i) => (
        <Item key={i} item={item} isOpen={allowMultiple ? open.includes(i) : open === i} onToggle={() => toggle(i)} />
      ))}
    </div>
  );
}
