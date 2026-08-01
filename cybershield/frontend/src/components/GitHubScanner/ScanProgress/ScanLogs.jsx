import { useEffect, useRef } from "react";

export default function ScanLogs({ logs }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="scan-logs-card">
      <h3 className="logs-title">Live Activity</h3>
      <div className="scan-logs" ref={containerRef}>
        {logs.map((log, index) => (
          <div key={index} className="log-item">
            <span className="log-time">[{log.time}]</span>
            <p className="log-msg">{log.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
