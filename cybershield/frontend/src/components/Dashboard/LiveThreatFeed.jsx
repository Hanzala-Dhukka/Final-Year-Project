import { useEffect, useRef } from "react";
import useDashboardSocket from "../../hooks/useDashboardSocket";
import "./LiveThreatFeed.css";

const SEVERITY_META = {
  Critical: { cls: "sev-critical", icon: "🔴" },
  High:     { cls: "sev-high",     icon: "🟠" },
  Medium:   { cls: "sev-medium",   icon: "🟡" },
  Low:      { cls: "sev-low",      icon: "🟢" },
  Info:     { cls: "sev-info",     icon: "🔵" },
};

function SeverityBadge({ severity }) {
  const { cls, icon } = SEVERITY_META[severity] ?? SEVERITY_META.Info;
  return (
    <span className={`ltf-badge ${cls}`} aria-label={`Severity: ${severity}`}>
      {icon} {severity}
    </span>
  );
}

export default function LiveThreatFeed({ maxItems = 10 }) {
  const { events, connected } = useDashboardSocket({ maxHistory: maxItems });
  const listRef = useRef(null);

  // Auto-scroll to newest entry
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [events]);

  return (
    <div className="ltf-widget widget-card" aria-live="polite" aria-label="Live Threat Feed">
      <div className="ltf-status-bar">
        <span className={`ltf-status ${connected ? "ltf-status--live" : "ltf-status--offline"}`}>
          <span className="ltf-pulse" aria-hidden="true" />
          {connected ? "Live" : "Offline"}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="ltf-empty">
          <span className="ltf-empty-icon" aria-hidden="true">🛡️</span>
          <p>Listening for events…</p>
          <p className="ltf-empty-sub">New threats will appear here in real time.</p>
        </div>
      ) : (
        <ul className="ltf-list" ref={listRef} aria-label="Threat events">
          {events.map((evt, idx) => (
            <li key={evt.id ?? idx} className="ltf-item">
              <div className="ltf-item-top">
                <span className="ltf-item-title">{evt.title}</span>
                <SeverityBadge severity={evt.severity ?? "Info"} />
              </div>
              <div className="ltf-item-meta">
                <span className="ltf-item-project">{evt.project}</span>
                <span className="ltf-item-time">{evt.timestamp}</span>
              </div>
              {evt.description && (
                <p className="ltf-item-desc">{evt.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
