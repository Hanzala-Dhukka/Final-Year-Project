import { motion, AnimatePresence } from "framer-motion";
import { FiCheck, FiLoader, FiClock, FiX } from "react-icons/fi";

const statusIcon = {
  completed: <FiCheck />,
  active: <FiLoader className="spin" />,
  pending: <FiClock />,
  cancelled: <FiX />,
};

const statusColor = {
  completed: "#22c55e",
  active: "#3b82f6",
  pending: "#64748b",
  cancelled: "#ef4444",
};

export default function ScanTimeline({ events = [] }) {
  if (events.length === 0) return null;

  return (
    <div className="scan-timeline">
      <div className="st-header">
        <h3>Progress Timeline</h3>
      </div>
      <div className="st-list">
        <AnimatePresence>
          {events.map((ev, i) => {
            const ts = ev.timestamp
              ? new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "";
            const color = statusColor[ev.status] || "#64748b";
            return (
              <motion.div
                key={i}
                className="st-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <div className="st-line">
                  <div className="st-dot" style={{ background: color, boxShadow: `0 0 8px ${color}44` }} />
                  {i < events.length - 1 && <div className="st-connector" />}
                </div>
                <div className="st-content">
                  <span className="st-event">{ev.event}</span>
                  <div className="st-meta">
                    <span className="st-time">{ts}</span>
                    <span className="st-icon" style={{ color }}>{statusIcon[ev.status]}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
