import { motion } from "framer-motion";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaUndo,
  FaDownload,
  FaShareAlt,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
} from "react-icons/fa";
import "./ScanControl.css";

export default function ScanActions({
  onStart,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onExport,
  onShare,
  onOpenReport,
  status = "idle", // idle, running, paused, completed, failed, cancelled
  canStart = true,
  isExporting = false,
  isSharing = false,
}) {
  const isActive = ["running", "paused"].includes(status);
  const isTerminal = ["completed", "failed", "cancelled"].includes(status);
  const isRunning = status === "running";
  const isPaused = status === "paused";

  const getPrimaryAction = () => {
    switch (status) {
      case "idle":
        return { label: "Start Scan", icon: <FaPlay size={18} />, onClick: onStart, variant: "primary", disabled: !canStart };
      case "running":
        return { label: "Pause", icon: <FaPause size={18} />, onClick: onPause, variant: "secondary" };
      case "paused":
        return { label: "Resume", icon: <FaPlay size={18} />, onClick: onResume, variant: "primary" };
      case "completed":
        return { label: "Re-scan", icon: <FaUndo size={18} />, onClick: onRetry, variant: "primary" };
      case "failed":
        return { label: "Retry", icon: <FaUndo size={18} />, onClick: onRetry, variant: "danger" };
      case "cancelled":
        return { label: "Retry", icon: <FaUndo size={18} />, onClick: onRetry, variant: "primary" };
      default:
        return { label: "Start Scan", icon: <FaPlay size={18} />, onClick: onStart, variant: "primary", disabled: !canStart };
    }
  };

  const primaryAction = getPrimaryAction();

  return (
    <motion.div
      className="actions-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <h3>Actions</h3>
      <div className="action-buttons">
        {/* Primary Action */}
        <motion.button
          className={`action-btn primary ${primaryAction.variant}`}
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label={primaryAction.label}
        >
          {primaryAction.icon}
          <span>{primaryAction.label}</span>
        </motion.button>

        {/* Secondary Actions - only show when active */}
        {isActive && (
          <>
            <motion.button
              className="action-btn secondary"
              onClick={onCancel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Cancel scan"
            >
              <FaStop size={18} />
              <span>Cancel</span>
            </motion.button>

            {isPaused && (
              <motion.button
                className="action-btn secondary"
                onClick={onResume}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Resume scan"
              >
                <FaPlay size={18} />
                <span>Resume</span>
              </motion.button>
            )}

            {isRunning && (
              <motion.button
                className="action-btn secondary"
                onClick={onPause}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Pause scan"
              >
                <FaPause size={18} />
                <span>Pause</span>
              </motion.button>
            )}
          </>
        )}

        {/* Terminal Actions */}
        {isTerminal && (
          <>
            <motion.button
              className="action-btn ghost"
              onClick={onExport}
              disabled={isExporting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Export results"
            >
              {isExporting ? <FaSpinner className="spin" size={18} /> : <FaDownload size={18} />}
              <span>{isExporting ? "Exporting..." : "Export"}</span>
            </motion.button>

            <motion.button
              className="action-btn ghost"
              onClick={onShare}
              disabled={isSharing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Share results"
            >
              {isSharing ? <FaSpinner className="spin" size={18} /> : <FaShareAlt size={18} />}
              <span>{isSharing ? "Sharing..." : "Share"}</span>
            </motion.button>

            <motion.button
              className="action-btn ghost"
              onClick={onOpenReport}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="View full report"
            >
              <FaExternalLinkAlt size={18} />
              <span>View Report</span>
            </motion.button>
          </>
        )}

        {/* Status Badge */}
        <motion.div
          className={`status-badge ${status}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {status === "completed" && <FaCheckCircle size={14} color="#22c55e" />}
          {status === "failed" && <FaTimesCircle size={14} color="#ef4444" />}
          {status === "running" && <FaSpinner className="spin" size={14} color="#3b82f6" />}
          {status === "paused" && <FaPause size={14} color="#f59e0b" />}
          {status === "cancelled" && <FaStop size={14} color="#ef4444" />}
          <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
        </motion.div>
      </div>
    </motion.div>
  );
}