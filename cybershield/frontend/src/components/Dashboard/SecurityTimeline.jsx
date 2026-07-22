import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import useDashboardSocket from "../../hooks/useDashboardSocket";
import "./SecurityTimeline.css";

const API = "http://localhost:8000/api/v1/dashboard/events";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const TYPE_ICON = {
  scan_completed:   "🔍",
  scan_progress:    "⏳",
  threat_detected:  "🚨",
  secret_found:     "🔑",
  vulnerability:    "⚠️",
  quiz_completed:   "🧠",
  owasp_completed:  "🛡️",
  login:            "👤",
  report_generated: "📋",
};

function timeLabel(isoString) {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

function dayLabel(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const today = new Date();
    const diff  = today.toDateString() === d.toDateString();
    return diff ? "Today" : d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function SecurityTimeline({ maxItems = 12 }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const { event } = useDashboardSocket();

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get(`${API}?limit=${maxItems}`, { headers: authHeader() });
      setTimeline(res.data?.events ?? []);
    } catch {
      /* API unavailable — keep existing timeline */
    } finally {
      setLoading(false);
    }
  }, [maxItems]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Prepend new WebSocket events
  useEffect(() => {
    if (!event) return;
    setTimeline((prev) => [event, ...prev].slice(0, maxItems));
  }, [event, maxItems]);

  return (
    <div className="st-widget widget-card" aria-label="Security Timeline">
      <div className="st-header">
        <div className="st-title-row">
          <span className="st-icon" aria-hidden="true">📅</span>
          <h3 className="st-title">Security Timeline</h3>
        </div>
      </div>

      {loading ? (
        <div className="st-loading" aria-busy="true">Loading events…</div>
      ) : timeline.length === 0 ? (
        <div className="st-empty">
          <span aria-hidden="true">🕒</span>
          <p>No recent events to display.</p>
        </div>
      ) : (
        <ol className="st-list" aria-label="Security timeline">
          {timeline.map((e, idx) => (
            <li key={e.id ?? idx} className="st-item">
              <span className="st-dot" aria-hidden="true">
                {TYPE_ICON[e.type ?? e.event] ?? "📌"}
              </span>
              <div className="st-line" aria-hidden="true" />
              <div className="st-content">
                <p className="st-title-txt">{e.title}</p>
                {e.description && (
                  <p className="st-desc">{e.description}</p>
                )}
                <span className="st-time">
                  {timeLabel(e.created_at)} · {dayLabel(e.created_at)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
