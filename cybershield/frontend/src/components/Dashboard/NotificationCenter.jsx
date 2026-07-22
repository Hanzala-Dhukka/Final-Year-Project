import { useState, useEffect } from "react";
import axios from "axios";
import useDashboardSocket from "../../hooks/useDashboardSocket";
import "./NotificationCenter.css";

const API = "http://localhost:8000/api/v1/dashboard/events";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function typeIcon(type = "") {
  const map = {
    scan_completed:   "🔍",
    scan_progress:    "⏳",
    threat_detected:  "🚨",
    secret_found:     "🔑",
    vulnerability:    "⚠️",
    quiz_completed:   "🧠",
    owasp_completed:  "🛡️",
    login:            "👤",
    report_generated: "📋",
    critical:         "🔴",
    high:             "🟠",
    medium:           "🟡",
    low:              "🟢",
  };
  return map[type.toLowerCase()] ?? "📌";
}

export default function NotificationCenter({ maxItems = 15 }) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { event } = useDashboardSocket();

  // Load initial events from REST API
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}?limit=${maxItems}`, { headers: authHeader() });
        const items = (res.data?.events ?? []).map((e) => ({ ...e, read: true }));
        setNotifications(items);
      } catch {
        /* API unavailable — start with empty list */
      } finally {
        setLoading(false);
      }
    })();
  }, [maxItems]);

  // Append new WebSocket events
  useEffect(() => {
    if (!event) return;
    setNotifications((prev) => [{ ...event, read: false }, ...prev].slice(0, maxItems));
    if (!open) setUnread((n) => n + 1);
  }, [event, open, maxItems]);

  const handleOpen = () => {
    setOpen(true);
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClose = () => setOpen(false);

  const clearAll = () => {
    setNotifications([]);
    setUnread(0);
  };

  return (
    <div className="nc-widget widget-card" aria-label="Notification Center">
      <div className="nc-header">
        <div className="nc-title-row">
          <span className="nc-icon" aria-hidden="true">🔔</span>
          <h3 className="nc-title">Notifications</h3>
        </div>
        <div className="nc-header-actions">
          {unread > 0 && (
            <span className="nc-badge" aria-label={`${unread} unread notifications`}>
              {unread > 99 ? "99+" : unread}
            </span>
          )}
          {notifications.length > 0 && (
            <button className="nc-clear-btn" onClick={clearAll} aria-label="Clear all notifications">
              Clear all
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="nc-loading" aria-busy="true">Loading…</div>
      ) : notifications.length === 0 ? (
        <div className="nc-empty">
          <span aria-hidden="true">🎉</span>
          <p>All clear — no new notifications.</p>
        </div>
      ) : (
        <ul className="nc-list" aria-label="Notifications">
          {notifications.map((n, idx) => (
            <li
              key={n.id ?? idx}
              className={`nc-item ${n.read ? "" : "nc-item--unread"}`}
              aria-label={`${n.read ? "" : "Unread: "}${n.title}`}
            >
              <span className="nc-item-icon" aria-hidden="true">{typeIcon(n.type)}</span>
              <div className="nc-item-body">
                <p className="nc-item-title">{n.title}</p>
                {n.description && (
                  <p className="nc-item-desc">{n.description}</p>
                )}
                <span className="nc-item-meta">
                  {n.project} · {n.timestamp ?? new Date(n.created_at).toLocaleTimeString()}
                </span>
              </div>
              {!n.read && <span className="nc-unread-dot" aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
