import { motion } from "framer-motion";
import { FaPlay, FaPause, FaStop, FaSync, FaExternalLinkAlt } from "react-icons/fa";
import "./ScanDashboard.css";

export default function ScanControls({
  status = "idle",
  onStart,
  onPause,
  onResume,
  onCancel,
  onViewResults,
}) {
  const isActive = status === "running";
  const isPaused = status === "paused";
  const isTerminal = ["completed", "failed", "cancelled"].includes(status);
  const isIdle = status === "idle";

  return (
    <motion.div
      className="scan-controls-card"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <div className="controls-row">
        {/* Start */}
        {!isActive && !isPaused && (
          <motion.button
            className="ctrl-btn primary"
            onClick={onStart}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FaPlay size={16} />
            <span>Start</span>
          </motion.button>
        )}

        {/* Pause */}
        {isActive && (
          <motion.button
            className="ctrl-btn warning"
            onClick={onPause}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FaPause size={16} />
            <span>Pause</span>
          </motion.button>
        )}

        {/* Resume */}
        {isPaused && (
          <motion.button
            className="ctrl-btn primary"
            onClick={onResume}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FaPlay size={16} />
            <span>Resume</span>
          </motion.button>
        )}

        {/* Cancel */}
        {(isActive || isPaused) && (
          <motion.button
            className="ctrl-btn danger"
            onClick={onCancel}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FaStop size={16} />
            <span>Cancel</span>
          </motion.button>
        )}

        {/* Retry after failure */}
        {(status === "failed" || status === "cancelled") && (
          <motion.button
            className="ctrl-btn primary"
            onClick={onStart}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FaSync size={16} />
            <span>Retry</span>
          </motion.button>
        )}

        {/* View Results */}
        {status === "completed" && (
          <motion.button
            className="ctrl-btn success"
            onClick={onViewResults}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FaExternalLinkAlt size={16} />
            <span>View Results</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}