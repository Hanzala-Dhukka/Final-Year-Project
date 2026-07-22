import { useState } from "react";
import "./Tabs.css";

/**
 * CyberShield Tabs
 * tabs: [{ value, label, icon?, badge? }]
 * Controlled or uncontrolled (value + onChange). Animated active indicator.
 */
export default function Tabs({ tabs = [], value, onChange, className = "" }) {
  const [internal, setInternal] = useState(tabs[0]?.value);
  const active = value !== undefined ? value : internal;

  const select = (v) => {
    if (value === undefined) setInternal(v);
    onChange?.(v);
  };

  return (
    <div className={`cs-tabs ${className}`} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={active === t.value}
          className={`cs-tab ${active === t.value ? "is-active" : ""}`}
          onClick={() => select(t.value)}
        >
          {t.icon && <span className="cs-tab__icon">{t.icon}</span>}
          <span>{t.label}</span>
          {t.badge != null && <span className="cs-tab__badge">{t.badge}</span>}
        </button>
      ))}
      <span
        className="cs-tabs__indicator"
        style={{
          width: `${100 / tabs.length}%`,
          transform: `translateX(${tabs.findIndex((t) => t.value === active) * 100}%)`,
        }}
      />
    </div>
  );
}
