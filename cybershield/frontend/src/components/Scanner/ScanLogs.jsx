import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiTerminal } from "react-icons/fi";

export default function ScanLogs({ logs = [] }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <div className="scan-logs">
      <div className="sl-header">
        <FiTerminal />
        <h3>Scan Logs</h3>
        <span className="sl-count">{logs.length} entries</span>
      </div>
      <div className="sl-body">
        <AnimatePresence>
          {logs.map((log, i) => {
            const ts = log.timestamp
              ? new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
              : "";
            return (
              <motion.div
                key={i}
                className="sl-entry"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="sl-time">[{ts}]</span>
                <span className="sl-msg">{log.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {logs.length === 0 && (
          <div className="sl-empty">Waiting for scan to start...</div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
