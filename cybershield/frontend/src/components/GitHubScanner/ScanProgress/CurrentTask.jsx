import { motion } from "framer-motion";
import { FaFolder, FaFileCode, FaShieldAlt, FaClock, FaSpinner, FaUsers } from "react-icons/fa";
import "./ScanDashboard.css";

const TASK_ITEMS = [
  { key: "currentStage", label: "Stage", icon: FaShieldAlt, color: "#6366f1" },
  { key: "currentFile", label: "File", icon: FaFileCode, color: "#3b82f6" },
  { key: "currentRule", label: "Rule", icon: FaFolder, color: "#8b5cf6" },
  { key: "elapsed", label: "Elapsed", icon: FaClock, color: "#22c55e" },
  { key: "eta", label: "ETA", icon: FaClock, color: "#f59e0b" },
  { key: "queuePosition", label: "Queue", icon: FaUsers, color: "#06b6d4" },
];

export default function CurrentTask({ scan }) {
  if (!scan || scan.status === "idle") {
    return (
      <motion.div
        className="current-task-card idle"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3>Current Activity</h3>
        <div className="task-empty">
          <p>No active scan. Configure and start a scan to see real-time progress.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`current-task-card ${scan.status}`}
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3>Current Activity</h3>
      <div className="task-grid">
        {TASK_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const value = scan[item.key];
          return (
            <motion.div
              key={item.key}
              className="task-item"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 + index * 0.05 }}
            >
              <div className="task-label">
                <Icon size={14} style={{ color: item.color }} />
                <span>{item.label}</span>
              </div>
              <div className="task-value" title={value || "—"}>
                {item.key === "currentStage" && scan.status === "running" && (
                  <FaSpinner className="spin" size={14} style={{ color: item.color, marginRight: 6 }} />
                )}
                {value || "—"}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}