import { motion } from "framer-motion";
import { FaPlay, FaPause, FaSpinner, FaCheckCircle, FaTimesCircle, FaStop } from "react-icons/fa";
import "./ScanDashboard.css";

const STATUS_CONFIG = {
  idle: { label: "Ready", color: "#64748b", icon: FaPlay },
  running: { label: "Running", color: "#3b82f6", icon: FaSpinner },
  paused: { label: "Paused", color: "#f59e0b", icon: FaPause },
  completed: { label: "Completed", color: "#22c55e", icon: FaCheckCircle },
  failed: { label: "Failed", color: "#ef4444", icon: FaTimesCircle },
  cancelled: { label: "Cancelled", color: "#ef4444", icon: FaStop },
};

export default function ProgressHeader({ status = "idle", progress = 0 }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const Icon = config.icon;

  return (
    <div className="progress-header">
      <div className="progress-header-left">
        <div className="progress-title-row">
          <h2>Security Scan Progress</h2>
          <motion.div
            className="status-badge"
            style={{ backgroundColor: `${config.color}20`, color: config.color, borderColor: config.color }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Icon size={14} className={status === "running" ? "spin" : ""} />
            <span>{config.label}</span>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="progress-percent"
        style={{ color: config.color }}
        key={progress}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {progress}%
      </motion.div>

      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          style={{ backgroundColor: config.color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {status === "running" && (
            <motion.div
              className="progress-shimmer"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}