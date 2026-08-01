import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaSpinner, FaPause, FaArrowDown } from "react-icons/fa";
import "./ScanDashboard.css";

const LOG_LEVELS = {
  success: { icon: FaCheck, color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  running: { icon: FaSpinner, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  warning: { icon: FaPause, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  error: { icon: FaPause, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

function getLogStyle(level) {
  return LOG_LEVELS[level] || LOG_LEVELS.success;
}

export default function LiveLogPanel({ logs = [], status = "idle" }) {
  const logEndRef = useRef(null);
  const scrollRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs.length, autoScroll]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    setUserScrolledUp(!isAtBottom);
    setAutoScroll(isAtBottom);
  };

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setAutoScroll(true);
    setUserScrolledUp(false);
  };

  const isRunning = status === "running";

  return (
    <motion.div
      className="live-log-card"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <div className="log-header">
        <h3>Live Logs</h3>
        <span className="log-count">{logs.length} entries</span>
      </div>

      <div
        className="log-panel"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {logs.length === 0 ? (
          <div className="log-empty">
            {isRunning ? (
              <>
                <FaSpinner className="spin" size={24} color="#3b82f6" />
                <p>Waiting for scan logs...</p>
              </>
            ) : (
              <p>No logs yet. Start a scan to see live output.</p>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {logs.map((log, index) => {
              const style = getLogStyle(log.level);
              const Icon = style.icon;
              return (
                <motion.div
                  key={index}
                  className="log-line"
                  style={{ backgroundColor: style.bg }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon
                    size={12}
                    style={{ color: style.color, flexShrink: 0 }}
                    className={log.level === "running" ? "spin" : ""}
                  />
                  <span className="log-text">{log.message || log}</span>
                  {log.time && (
                    <span className="log-time">{log.time}</span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={logEndRef} />
      </div>

      {userScrolledUp && (
        <motion.button
          className="scroll-to-bottom"
          onClick={scrollToBottom}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <FaArrowDown size={14} />
          New logs
        </motion.button>
      )}
    </motion.div>
  );
}