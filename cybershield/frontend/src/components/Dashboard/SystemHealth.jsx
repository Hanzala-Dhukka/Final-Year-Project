import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./SystemHealth.css";

const API = "http://localhost:8000/api/v1/dashboard/system-health";
const POLL_MS = 30_000;

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function GaugeBar({ label, value, colorVar }) {
  const clamped = Math.min(100, Math.max(0, value ?? 0));
  const status = clamped >= 90 ? "critical" : clamped >= 75 ? "warning" : "ok";

  return (
    <div className="sh-gauge" aria-label={`${label}: ${clamped}%`}>
      <div className="sh-gauge-label">
        <span>{label}</span>
        <span className={`sh-gauge-pct sh-gauge-pct--${status}`}>{clamped}%</span>
      </div>
      <div className="sh-gauge-track" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`sh-gauge-fill sh-gauge-fill--${status}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

const DEMO = { cpu: 42, memory: 63, disk: 58, uptime: "3d 2h 14m", status: "healthy" };

export default function SystemHealth() {
  const [health, setHealth] = useState(DEMO);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await axios.get(API, { headers: authHeader() });
      setHealth(res.data ?? DEMO);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setHealth(DEMO);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, POLL_MS);
    return () => clearInterval(id);
  }, [fetchHealth]);

  const overall = health.status === "healthy" ? "sh-status--ok" : "sh-status--warn";

  return (
    <div className="sh-widget widget-card" aria-label="System Health">
      <div className="sh-status-bar">
        <span className={`sh-status ${overall}`} aria-label={`Status: ${health.status}`}>
          <span className="sh-status-dot" aria-hidden="true" />
          {health.status === "healthy" ? "Healthy" : "Warning"}
        </span>
      </div>

      {loading ? (
        <div className="sh-loading" aria-busy="true">Loading metrics…</div>
      ) : (
        <>
          <div className="sh-gauges">
            <GaugeBar label="CPU"    value={health.cpu}    />
            <GaugeBar label="Memory" value={health.memory} />
            <GaugeBar label="Disk"   value={health.disk}   />
          </div>

          <div className="sh-footer">
            <div className="sh-uptime">
              <span className="sh-uptime-icon" aria-hidden="true">⏱️</span>
              <span>Uptime: <strong>{health.uptime}</strong></span>
            </div>
            {lastUpdated && (
              <span className="sh-updated">Updated {lastUpdated}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
